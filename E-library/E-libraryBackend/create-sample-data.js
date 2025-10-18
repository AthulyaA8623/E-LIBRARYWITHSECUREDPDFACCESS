const mongoose = require('mongoose');
require('dotenv').config();

const Book = require('./models/Book');

const sampleBooks = [
  {
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    description: "A classic novel of the Jazz Age",
    publishedYear: 1925,
    publisher: "Scribner",
    genre: "Fiction",
    totalCopies: 5,
    availableCopies: 3,
    pages: 180,
    language: "English"
  },
  {
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    description: "A novel about racial inequality and moral growth",
    publishedYear: 1960,
    publisher: "J.B. Lippincott & Co.",
    genre: "Fiction",
    totalCopies: 4,
    availableCopies: 4,
    pages: 281,
    language: "English"
  },
  {
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    description: "Dystopian social science fiction novel",
    publishedYear: 1949,
    publisher: "Secker & Warburg",
    genre: "Science Fiction",
    totalCopies: 6,
    availableCopies: 2,
    pages: 328,
    language: "English"
  },
  {
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    description: "Romantic novel of manners",
    publishedYear: 1813,
    publisher: "T. Egerton",
    genre: "Romance",
    totalCopies: 3,
    availableCopies: 3,
    pages: 432,
    language: "English"
  },
  {
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    description: "Fantasy novel and children's book",
    publishedYear: 1937,
    publisher: "George Allen & Unwin",
    genre: "Fantasy",
    totalCopies: 5,
    availableCopies: 1,
    pages: 310,
    language: "English"
  }
];

async function createSampleData() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/elibrary');
    console.log('✅ Connected to MongoDB');

    // Clear existing books
    await Book.deleteMany({});
    console.log('🗑️  Cleared existing books');

    // Insert sample books
    await Book.insertMany(sampleBooks);
    console.log(`✅ Added ${sampleBooks.length} sample books to database`);

    // Display the created books
    const books = await Book.find();
    console.log('\n📚 Sample Books Created:');
    books.forEach(book => {
      console.log(`   - ${book.title} by ${book.author}`);
    });

    console.log('\n🎉 Sample data creation completed!');
    console.log('📖 You can now access books at: http://localhost:5000/api/books');

  } catch (error) {
    console.error('❌ Error creating sample data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('📋 Database connection closed');
  }
}

createSampleData();