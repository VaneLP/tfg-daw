import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
    titulo: {
        type: String,
        required: true,
        trim: true
    },
    contenido: {
        type: String,
        required: true
    },
    imagenDestacada: {
        type: String
    },
    autorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fechaPublicacion: {
        type: Date,
        default: Date.now
    },
}, {
    timestamps: true
});

const BlogPost = mongoose.model('BlogPost', blogPostSchema);
export default BlogPost;