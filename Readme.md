# SocialConnect - Scalable Social Media Backend

SocialConnect is a high-performance, scalable backend system for a modern social media platform, built using **Fastify**, **Node.js**, and **MongoDB**. It provides robust APIs for user management, content creation, social interactions, and media handling, making it an ideal foundation for building next-generation social applications.

---

## Table of Contents

* [Features](#features)
* [Tech Stack](#tech-stack)
* [Installation](#installation)
* [Environment Variables](#environment-variables)
* [Scripts](#scripts)
* [API Overview](#api-overview)

  * [User Management](#user-management)
  * [Post Management](#post-management)
  * [Likes](#likes)
  * [Follows](#follows)
  * [Comments](#comments)
  * [Bookmarks](#bookmarks)
* [Database Models](#database-models)
* [Security & Best Practices](#security--best-practices)
* [License](#license)

---

## Features

* **Robust User Authentication** (JWT-based)
* **Password Reset Functionality**
* **Secure Password Hashing with Bcrypt**
* **Media Upload & Management (Cloudinary)**
* **Post Creation, Editing, Deletion**
* **Likes, Comments, Replies, Bookmarks**
* **Follow/Unfollow System**
* **Efficient Search**
* **Extensible & Modular Codebase**

---

## Tech Stack

* **Backend:** Fastify, Node.js
* **Database:** MongoDB with Mongoose
* **Authentication:** @fastify/jwt, bcrypt
* **Media Storage:** Cloudinary via fastify-cloudinary
* **Mailing:** Nodemailer, fastify-mailer, Mailgen
* **Environment Management:** @fastify/env
* **Other Utilities:** @fastify/cors, @fastify/sensible, @fastify/cookie, @fastify/multipart

---

## Installation

```bash
# Clone the repository
git clone https://github.com/thegobindadas/SocialConnect.git
cd SocialConnect

# Install dependencies
npm install

# Start the server
npm run dev
```

---

## Environment Variables

Create a `.env` file at the project root with the following keys:

```env
PORT=8000
MONGODB_URI=your_mongo_db_connection_string
CORS_ORIGIN=*  # add the frontend URL (more secure)
APP_NAME=SocialConnect
CLIENT_URL=http://localhost:3000
RESET_PASSWORD_REDIRECT_URL=your_reset_password_redirect_url
ACCESS_TOKEN_SECRET=your_access_token_secret
ACCESS_TOKEN_EXPIRY=1d
REFRESH_TOKEN_SECRET=your_refresh_token_secret
REFRESH_TOKEN_EXPIRY=10d
TEMPORARY_TOKEN_EXPIRY=20
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
SMTP_MAIL_HOST=your_smtp_mail_host
SMTP_MAIL_PORT=your_smtp_mail_port
SMTP_MAIL_USERNAME=your_smtp_mail_username
SMTP_MAIL_PASSWORD=your_smtp_mail_password
SMTP_SENDER_EMAIL=your_smtp_sender_email
```

---

## Scripts

```bash
# Start in development mode
npm run dev

# Start in production mode
npm start

```

---

## API Overview

### User Management

* **POST** `/api/v1/users/register` — Register new user
* **POST** `/api/v1/users/login` — Login user
* **POST** `/api/v1/users/logout` — Logout user
* **POST** `/api/v1/users/refresh-token` — Refresh access token
* **POST** `/api/v1/users/forgot-password` — Request password reset
* **POST** `/api/v1/users/reset-password/:resetToken` — Reset forgotten password
* **PATCH** `/api/v1/users/update/password` — Update current password
* **PATCH** `/api/v1/users/update/profile-pic` — Update profile picture
* **GET** `/api/v1/users/me` — Get current user profile
* **PATCH** `/api/v1/users/update/profile` — Update user profile
* **GET** `/api/v1/users/:username/profile` — Get public user profile
* **GET** `/api/v1/users/search` — Search users

### Post Management

* **POST** `/api/v1/posts/` — Create a new post
* **PATCH** `/api/v1/posts/:postId/status` — Toggle publish status
* **PATCH** `/api/v1/posts/:postId/update` — Update post content
* **GET** `/api/v1/posts/:postId` — Get post by ID
* **GET** `/api/v1/posts/u/:username` — Get posts by user
* **GET** `/api/v1/posts/feed` — Get all posts
* **PATCH** `/api/v1/posts/:postId/update/media` — Update post media
* **DELETE** `/api/v1/posts/:postId/delete/media` — Delete post media
* **DELETE** `/api/v1/posts/:postId` — Delete post

### Likes

* **POST** `/api/v1/likes/p/:postId` — Like or unlike a post
* **POST** `/api/v1/likes/c/:commentId` — Like or unlike a comment

### Follows

* **POST** `/api/v1/follows/u/:followingId` — Follow or unfollow a user
* **GET** `/api/v1/follows/u/:username/followers` — Get user's followers
* **GET** `/api/v1/follows/u/:username/followings` — Get users they are following

### Comments

* **POST** `/api/v1/comments/:postId` — Create a comment
* **PATCH** `/api/v1/comments/:commentId` — Update a comment
* **PATCH** `/api/v1/comments/:commentId/:parentCommentId` — Update a reply to a comment
* **DELETE** `/api/v1/comments/:commentId` — Delete a comment or reply
* **GET** `/api/v1/comments/p/:postId` — Get comments for post
* **GET** `/api/v1/comments/:commentId/replies` — Get replies to a comment

### Bookmarks

* **POST** `/api/v1/bookmarks/p/:postId` — Bookmark or unbookmark post
* **GET** `/api/v1/bookmarks/me` — Get current user's bookmarks

---

## Database Models

The system uses the following core models:

* **User**: Profile, authentication, bio, profile picture
* **Post**: Content, media, tags, author reference
* **Like**: Likes on posts and comments
* **Follow**: Follower/following relationships
* **Comment**: Comments and threaded replies
* **Bookmark**: Saved posts for later viewing

---

## Security & Best Practices

* **Password Hashing:** Bcrypt with strong salt rounds
* **JWT-based Authentication:** Separate access & refresh tokens
* **Input Validation:** Ensure clean inputs to prevent injection attacks
* **Rate Limiting & CORS:** Configured via Fastify plugins
* **Media Handling:** Cloudinary for optimized media storage
* **Password Recovery:** Token-based secure email flows
* **Modular Architecture:** Easy to extend and maintain

---

## License

This project is licensed under the **MIT License**.

---

### Contributions Welcome

Feel free to fork the project and submit pull requests to contribute. Bug reports and feature requests are appreciated!

---

© 2025 SocialConnect. All rights reserved.
