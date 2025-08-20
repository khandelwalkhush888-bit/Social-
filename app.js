// Firebase is already initialized in each HTML page (via firebase.initializeApp)
// So here we can directly use it

const auth = firebase.auth();
const db = firebase.database();
const storage = firebase.storage();

/* ---------------- AUTH FUNCTIONS ---------------- */

function signup() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.createUserWithEmailAndPassword(email, password)
    .then(() => {
      alert("Signup successful!");
      window.location.href = "home.html";
    })
    .catch(error => {
      alert(error.message);
    });
}

function login() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  auth.signInWithEmailAndPassword(email, password)
    .then(() => {
      alert("Login successful!");
      window.location.href = "home.html";
    })
    .catch(error => {
      alert(error.message);
    });
}

function logout() {
  auth.signOut().then(() => {
    window.location.href = "index.html";
  });
}

/* ---------------- POSTS (HOME PAGE) ---------------- */

function uploadPost() {
  const file = document.getElementById("uploadFile").files[0];
  if (!file) {
    alert("Please select a file");
    return;
  }

  const user = auth.currentUser;
  const storageRef = storage.ref("posts/" + Date.now() + "-" + file.name);

  storageRef.put(file).then(snapshot => {
    snapshot.ref.getDownloadURL().then(url => {
      db.ref("posts").push({
        user: user.email,
        fileUrl: url,
        type: file.type.startsWith("video") ? "video" : "image",
        time: new Date().toLocaleString()
      });
      alert("Post uploaded!");
    });
  });
}

function loadPosts() {
  const postsDiv = document.getElementById("posts");
  if (!postsDiv) return;

  db.ref("posts").on("value", snapshot => {
    postsDiv.innerHTML = "";
    snapshot.forEach(child => {
      const post = child.val();
      const div = document.createElement("div");
      div.classList.add("post");

      if (post.type === "image") {
        div.innerHTML = `<p><b>${post.user}</b></p><img src="${post.fileUrl}" width="300"><p>${post.time}</p>`;
      } else {
        div.innerHTML = `<p><b>${post.user}</b></p><video width="300" controls src="${post.fileUrl}"></video><p>${post.time}</p>`;
      }

      postsDiv.appendChild(div);
    });
  });
}

/* ---------------- CHAT PAGE ---------------- */

function sendMessage() {
  const msgInput = document.getElementById("messageInput");
  const message = msgInput.value.trim();
  if (!message) return;

  const user = auth.currentUser;

  db.ref("messages").push({
    user: user.email,
    text: message,
    time: new Date().toLocaleString()
  });

  msgInput.value = "";
}

function loadMessages() {
  const messagesDiv = document.getElementById("messages");
  if (!messagesDiv) return;

  db.ref("messages").on("value", snapshot => {
    messagesDiv.innerHTML = "";
    snapshot.forEach(child => {
      const msg = child.val();
      const div = document.createElement("div");
      div.classList.add("message");
      div.innerHTML = `<b>${msg.user}:</b> ${msg.text} <br><small>${msg.time}</small>`;
      messagesDiv.appendChild(div);
    });
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  });
}

/* ---------------- PROFILE PAGE ---------------- */

function updateProfile() {
  const bio = document.getElementById("bio").value;
  const user = auth.currentUser;

  db.ref("profiles/" + user.uid).set({
    email: user.email,
    bio: bio
  });

  alert("Profile updated!");
}

function loadProfile() {
  const bioInput = document.getElementById("bio");
  if (!bioInput) return;

  const user = auth.currentUser;
  db.ref("profiles/" + user.uid).once("value").then(snapshot => {
    if (snapshot.exists()) {
      bioInput.value = snapshot.val().bio;
    }
  });
}

/* ---------------- AUTO RUN ---------------- */

auth.onAuthStateChanged(user => {
  if (user) {
    // If on home page, load posts
    loadPosts();

    // If on chat page, load messages
    loadMessages();

    // If on profile page, load profile data
    loadProfile();
  }
});