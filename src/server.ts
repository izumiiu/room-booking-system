import mongoose from 'mongoose';
import connectDB from './config/dbConn.js';
import app from './app.js';

const PORT = process.env.PORT || 3500;

connectDB();


mongoose.connection.once('open', () => {
  console.log('Connected to MongoDB');
  app.listen(PORT, () => {console.log(`server running on port ${PORT}`)});   // ย้าย listen เข้ามาไว้ในนี้
});

