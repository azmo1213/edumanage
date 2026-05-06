// Firebase is loaded via CDN scripts in index.html
// Do NOT use import statements here

const firebaseConfig = {
  apiKey: "AIzaSyBB0YRipYhXAiKLV5ClnH92nvGhx6EfN8o",
  authDomain: "edumanage-c803c.firebaseapp.com",
  projectId: "edumanage-c803c",
  storageBucket: "edumanage-c803c.firebasestorage.app",
  messagingSenderId: "477258768562",
  appId: "1:477258768562:web:370898cda43d29465929ab"
};

firebase.initializeApp(firebaseConfig);
const db   = firebase.firestore();
const auth = firebase.auth();
console.log('[Firebase] initialized successfully');