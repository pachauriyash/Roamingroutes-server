import dotenv from 'dotenv';
import express from 'express';
import mongoose from "mongoose";
import  session from "express-session";
import  passport from "passport";
import bodyparser from 'body-parser';
import User from "./schema/user.js";
import Article from "./schema/article.js";
import MailingList from "./schema/mailinglist.js";
import cors from 'cors';
import fs from 'fs';  
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import {v4 as uuidv4} from 'uuid';

dotenv.config();

// Get the current module's URL
const currentModuleUrl = import.meta.url;

// Convert the URL to a file path
const currentModulePath = fileURLToPath(currentModuleUrl);

// Get the directory name
const currentModuleDir = dirname(currentModulePath);




const app = express();
const port = 9000;
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', 'http://localhost:3000');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  next();
});
// app.use(cors({
//   origin: 'https://roamingroutes-frontend-pachauriyash.vercel.app',
//   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
//   credentials: true,
// }));


// Increase the payload size limit (default is 100kb)
app.use(bodyparser.json({limit: '50mb'}));
app.use(bodyparser.urlencoded({limit: '50mb', extended: true}));


// Connect to MongoDB
mongoose.set('strictQuery', true);
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Passport configuration
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// Express session middleware
app.use(session({
    secret: process.env.SECRET,
    resave: false,
    saveUninitialized: false,
  }));
  app.use(passport.initialize());
  app.use(passport.session());
  
//json image setup
app.use(bodyparser.json());

const databasePath = path.join(currentModuleDir, 'images.json');

// Function to read image data based on ID
const getImageData = (id) => {
  const imageData = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
  // console.log(id);
  const imageObject = imageData.find(item => item.id === id);
  return imageObject ? imageObject.imageData : null;
};
// Function to write image data
const writeImageData = ({imageData,articleid,type}) => {
  const currentData = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
  const newImageObject = {
    id: uuidv4(), // Now using uuid for unique IDs
    articleid,
    imageData,
    type,
  };
  currentData.push(newImageObject);
  fs.writeFileSync(databasePath, JSON.stringify(currentData, null, 2));
  return newImageObject.id;
};
//update articleid
const writearticleid = ({id,articleid}) => {
  const imageData = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
  const imageObject = imageData.find(item => item.id === id);
  const index = imageData.indexOf(imageObject);
  if(index!=-1){
    imageData[index].articleid = articleid;
    fs.writeFileSync(databasePath, JSON.stringify(imageData, null, 2));
    console.log("articleid updated");
  }else{
    console.log("articleid not updated");
    return null;
  }


};
// Function to edit image data based on ID
const editImageData = (articleid,type, updatedImageData) => {
  const imageData = JSON.parse(fs.readFileSync(databasePath, 'utf-8'));
  // Find the index of the image object with the specified ID
  const imageObject = imageData.find(item => item.articleid === articleid && item.type === type);
  const index = imageData.indexOf(imageObject);
  // console.log(imageObject);
  if (imageObject) {
    // If the image object is found, update its imageData property
    imageData[index].imageData = updatedImageData;
    // Write the updated data back to the JSON file
    fs.writeFileSync(databasePath, JSON.stringify(imageData, null, 2));
    return true; // Indicates successful edit
  } else {
    return false; // Indicates that the image with the specified ID was not found
  }
};


// Routes


app.get('/featured-blogs', async (req, res) => {
  try {
    const blogs = await Article.find({ types: 'Blog' }).limit(3).populate('author', 'Name username profilepic instaurl linkedinurl twitterurl');
    const destinations = await Article.find({ types: 'Destination' }).limit(2).populate('author', 'Name username profilepic instaurl linkedinurl twitterurl');

    // Fetch image data for each featured item (blog or destination)
    const featuredItemsWithImageData = await Promise.all(
      [...blogs, ...destinations].map(async (item) => {
        const coverphotoData = await getImageData(item.coverphoto);
        const image1Data = await getImageData(item.image1);
        const authorData = await getImageData(item.author.profilepic);
        // Update the item object before sending
        const itemWithImageData = item.toObject();
        itemWithImageData.coverphoto = coverphotoData;
        itemWithImageData.image1 = image1Data;
        itemWithImageData.author.profilepic = authorData;

        return itemWithImageData;
      })
    );

    // Separate the featured items back into blogs and destinations
    const blogsWithImageData = featuredItemsWithImageData.filter((item) => item.types === 'Blog');
    const destinationsWithImageData = featuredItemsWithImageData.filter((item) => item.types === 'Destination');

    const articles = { blogs: blogsWithImageData, destinations: destinationsWithImageData };
    res.status(200).json(articles);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


app.get('/all-blogs', async (req, res) => {
  try {
    const blogs = await Article.find({ types: 'Blog' }).populate('author', 'Name username profilepic instaurl linkedinurl twitterurl');

    // Fetch image data for each blog
    const blogsWithImageData = await Promise.all(blogs.map(async (blog) => {
      const coverphotoData = await getImageData(blog.coverphoto);
      const image1Data = await getImageData(blog.image1);
      const authorData = await getImageData(blog.author.profilepic);
      // Update the blog object before sending
      const blogWithImageData = blog.toObject();
      blogWithImageData.coverphoto = coverphotoData;
      blogWithImageData.image1 = image1Data;
      blogWithImageData.author.profilepic = authorData;


      return blogWithImageData;
    }));

    res.status(200).json(blogsWithImageData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/all-destinations', async (req, res) => {
  try {
    const destinations = await Article.find({ types: 'Destination' }).populate('author', 'Name username profilepic instaurl linkedinurl twitterurl');

    // Fetch image data for each destination
    const destinationsWithData = await Promise.all(destinations.map(async (destination) => {
      const coverphotoData = await getImageData(destination.coverphoto);
      const image1Data = await getImageData(destination.image1);
      const authorData = await getImageData(destination.author.profilepic);

      // Update the destination object before sending
      const destinationWithImageData = destination.toObject();
      destinationWithImageData.coverphoto = coverphotoData;
      destinationWithImageData.image1 = image1Data;
      destinationWithImageData.author.profilepic = authorData;
      return destinationWithImageData;
    }));

    res.status(200).json(destinationsWithData);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/editarticle/:articleId', async (req, res) => {
  try {
    const article = await Article.findById(req.params.articleId).populate('author', 'Name username profilepic instaurl linkedinurl twitterurl');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }
    if (req.isAuthenticated()){
      if (article.author._id.toString() !== req.user._id.toString()) {
        console.log('User is not the author of the article');
        return res.status(403).json({ error: 'Unauthorized' });
      }else{
        // Send the article data if authorized
        // res.status(200).json({ articleData: article.toObject() });
        // Fetch image data for coverphoto and image1
        const coverphotoData = await getImageData(article.coverphoto);
        const image1Data = await getImageData(article.image1);
        // Update the articleData object before sending
        const articleData = article.toObject();
        articleData.coverphoto = coverphotoData;
        articleData.image1 = image1Data;
        res.status(200).json({ articleData});
      }
    } else {
      // User is not authenticated
      return res.status(401).json({ error: 'Not Authenticated' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Route to handle updating an article
app.patch('/editarticle/:articleId', async (req, res) => {
  try {
    // console.log(req.body);
    const { articleId } = req.params;
    // const { oldcoverphoto, oldimage1 } = req.body; // Assuming the old cover photo and old image1 IDs are sent in the request body
    const updatedArticleData = req.body.articledata; // Assuming the entire article data is sent in the request body
    
    // Find the article by ID
    const article = await Article.findById(articleId);

    // If the article doesn't exist, return a 404 status
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Check if the user is authorized to update the article
    if (article.author._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }
    
    // Update the article with the new data (excluding coverphoto and image1)
    // const { coverphoto, image1, ...updatedArticleDataWithoutImages } = updatedArticleData;
    const { coverphoto, image1, ...updatedArticleDataWithoutImages } = {
      ...updatedArticleData,
      updatedAt: Date.now(),
    };
    
    const updatedArticle = await Article.findByIdAndUpdate(articleId, updatedArticleDataWithoutImages, { new: true });

    // Send the updated article as the response
    res.status(200).json({ message: 'Article updated successfully', article: updatedArticle });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Internal server error' });
  }
});



//Authentication routes
app.get('/check-login-status', (req, res) => {
    if (req.isAuthenticated()) {
      // User is authenticated
      const userdata ={
        _id: req.user._id,
        Name: req.user.Name,
        username: req.user.username,
        // profilepic: req.user.profilepic,
        profilepic: getImageData(req.user.profilepic),
        linkedinurl: req.user.linkedinurl,
        twitterurl: req.user.twitterurl,
        instaurl: req.user.instaurl,
    };
      res.status(200).json({ isLoggedIn: true, userdata:userdata });
    } else {
      // User is not authenticated
      res.status(200).json({ isLoggedIn: false,userdata:null });
    }
  });
app.post('/login', function (req, res, next) {
    passport.authenticate('local', function (err, user, info) {
      if (err) {
        console.error(err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      if (!user) {
        // Authentication failed
        console.log('Authentication failed');
        return res.status(401).json({ error: 'Unauthorized' });
      }
  
      req.logIn(user, function (err) {
        if (err) {
          console.error(err);
          return res.status(500).json({ error: 'Internal server error' });
        }
  
        // Authentication succeeded
        console.log('User authenticated successfully');
        const userdata ={
            _id: req.user._id,
            Name: req.user.Name,
            username: req.user.username,
            // profilepic: req.user.profilepic,
            profilepic: getImageData(req.user.profilepic),
            linkedinurl: req.user.linkedinurl,
            twitterurl: req.user.twitterurl,
            instaurl: req.user.instaurl,
        };
        return res.status(200).json(userdata);
      });
    })(req, res, next);
  });


  app.post('/signup', async (req, res) => {
    try {
      console.log(req.body); // Log the entire request body
      const user = new User({
        Name: req.body.Name,
        username: req.body.username,
        // profilepic: req.body.profilepic,
        profilepic:  writeImageData({imageData:req.body.profilepic,articleid:null,type:"profilepic"}),
        linkedinurl: req.body.linkedinurl,
        twitterurl: req.body.twitterurl,

        instaurl: req.body.instaurl,
      });
      
      User.register(user, req.body.password, function (err) {
        if (err) {
          console.log(err);
          return res.status(400).json({ error: 'User registration failed' });
        }
        passport.authenticate('local')(req, res, function () {
          console.log('User created successfully');
          res.status(200).json({ message: 'User created successfully' });
        });
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
  // Logout route
app.post('/logout', (req, res) => {
  // Destroy the session to log the user out
  req.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }
    // Send a response indicating successful logout
    console.log('Logout successful');
    res.json({ message: 'Logout successful' });
  });
});

  //article post
  app.post("/article/publish", function(req, res){
    if (req.isAuthenticated()) {
        // User is authenticated
        // console.log('Request Body:', req.body);
        const article = new Article({
        username: req.user.username,
        types: req.body.types,
        title: req.body.postTitle,
        // coverphoto: req.body.coverphoto,
        coverphoto: writeImageData({imageData:req.body.coverphoto,articleid:null,type:"coverphoto"}),
        heading1: req.body.heading1,
        content1: req.body.content1,
        // image1: req.body.image1,
        image1: writeImageData({imageData:req.body.image1,articleid:null,type:"image1"}),
        content2: req.body.content2,
        heading2: req.body.heading2,
        content3: req.body.content3,
        tags: req.body.tags,
        author: req.user._id,
    });
    article.save(function(err){
  
      if (!err){
        writearticleid({id:article.coverphoto,articleid:article._id});
        writearticleid({id:article.image1,articleid:article._id});
        console.log('Article Published successfully');
        res.status(200).json({ message: 'Article Published successfully' });
      }else{
        console.log(err);  
      }
  });

      } else {
        // User is not authenticated
        return res.status(401).json({ error: 'Unauthorized' });
      }
    
  });
  app.post('/subscribe', async (req, res) => {
    try {
      // Assuming the email is sent in the request body as 'email'
      const { email } = req.body;
        console.log(email);
      // Create a new MailingList instance
      const mailingListEntry = new MailingList({
        email,
      });
  
      // Save the entry to the database
      await mailingListEntry.save();
  
      res.status(200).json({ message: 'Subscribed to mailing list successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

// Start the server
app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
  });