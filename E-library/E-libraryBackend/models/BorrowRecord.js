const mongoose = require('mongoose');

const borrowRecordSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    book: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Book',
        required: true
    },
    borrowDate: {
        type: Date,
        default: Date.now
    },
    dueDate: {
        type: Date,
        required: true
    },
    returnDate: {
        type: Date
    },
    status: {
        type: String,
        enum: ['borrowed', 'returned', 'overdue'],
        default: 'borrowed'
    },
    fine: {
        type: Number,
        default: 0
    }
}, {
    timestamps: true
});

// Calculate due date (14 days from borrow date)
borrowRecordSchema.pre('save', function(next) {
    if (!this.dueDate) {
        const dueDate = new Date(this.borrowDate);
        dueDate.setDate(dueDate.getDate() + 14);
        this.dueDate = dueDate;
    }
    next();
});

module.exports = mongoose.model('BorrowRecord', borrowRecordSchema);