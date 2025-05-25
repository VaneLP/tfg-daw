import { resolve } from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        rollupOptions: {
            input: {
                main: resolve(__dirname, 'index.html'),
                animals: resolve(__dirname, 'animals.html'),
                animal_detail: resolve(__dirname, 'animal_detail.html'),
                login: resolve(__dirname, 'login.html'),
                register_choice: resolve(__dirname, 'register_choice.html'),
                register_user: resolve(__dirname, 'register_user.html'),
                register_protective: resolve(__dirname, 'register_protective.html'),
                profile: resolve(__dirname, 'profile.html'),
                applications: resolve(__dirname, 'applications.html'),
                add_pet: resolve(__dirname, 'add_pet.html'),
                blog: resolve(__dirname, 'blog.html'),
                blog_detail: resolve(__dirname, 'blog_detail.html'),
                add_edit_blog: resolve(__dirname, 'add_edit_blog.html'),
                admin_users: resolve(__dirname, 'admin_users.html'),
            },
        },
        outDir: 'dist'
    },

});