# CookMate 🍳

CookMate is a multi-platform recipe sharing and management system featuring both a **Web Application** and a **Mobile Application** connected via Firebase Authentication and Cloud Firestore.

---

## 👥 Authors & Team Members

* **[Adrian Nazar]**
* **[Jenina Gail Ayuban]**
* **[John Luc Bartolome]**
* **[Yzaiah Patawaran]**

---

## 🛠️ Tech Stack

* **Web Application:** React, Vite, Tailwind CSS, Lucide Icons
* **Mobile Application:** React Native, Expo, Lucide React Native Icons
* **Backend & Database:** Firebase Authentication, Cloud Firestore, Firebase Hosting

---

## 📋 Features

* **User Authentication:** 
  * Sign up with name, birthdate, email, and password.
  * Password confirmation validation and friendly error handling.
  * Email password reset support.
* **Recipe Exploration:** 
  * Real-time sync with Cloud Firestore across web and mobile.
  * Search recipes by title and filter by categories (Breakfast, Lunch, Dinner, Dessert, Snacks).
* **Recipe Creation & Management:** 
  * Create custom recipes with step-by-step instructions and ingredient lists.
  * Optional anonymous posting.
  * Delete owned recipes.
* **Interactive Reviews & Ratings:** 
  * Star ratings and text reviews (max 50 words).
  * Authors/Admins can delete comment reviews.
* **Interactive Cooking View:** 
  * Track cooked ingredients using an interactive checklist.

---

## 📁 Project Structure

```text
cookmate/
├── .firebase/                  # Firebase deployment cache
├── cookmate-mobile/            # Mobile Application (Expo / React Native)
│   ├── assets/                 # App icons and image assets
│   ├── scripts/                # Development and build scripts
│   ├── src/                    # Mobile screens & components
│   ├── App.js                  # Mobile app root component
│   ├── app.json                # Expo configuration
│   ├── eas.json                # Expo Application Services config
│   └── package.json            # Mobile dependencies
├── dist/                       # Production web build output
├── public/                     # Public web assets
├── src/                        # Web Application source code
├── .firebaserc                 # Firebase project configuration
├── firebase.json               # Firebase rules and hosting configuration
├── index.html                  # Web HTML entry point
├── package.json                # Web dependencies
├── tailwind.config.js          # Tailwind CSS styling config
├── vite.config.js              # Vite web bundler config
└── README.md                   # Project documentation
