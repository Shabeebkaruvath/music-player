const audioPlay = document.getElementById("Audio-Player");
const musicPlay = document.getElementById("play");
const musicPause = document.getElementById("pause");
const musicNext = document.getElementById("next");
const musicPre = document.getElementById("pre");
const musicName = document.getElementById("song-name");
const musicArtist = document.getElementById("artist-name");
const musicShuffle = document.getElementById("shuffle");
const musicRepeat = document.getElementById("repeat");
const musicImg = document.getElementById("song-img");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const progress = document.querySelector(".progress");
const progressHandle = document.querySelector(".progress-handle");
const currentTimeSpan = document.querySelector(".current-time");
const endTimeSpan = document.querySelector(".end-time");
const searchClear = document.getElementById("clearButton");
const searchInput = document.getElementById("search");
const suggestionsContainer = document.getElementById("suggestions");

suggestionsContainer.style.display = "none";

let currentSongIndex = 0;
let searchResults = [];
let isDragging = false;
let shuffle = false; // Shuffle state
let repeatState = 0; // 0: no repeat, 1: repeat all, 2: repeat one

// Function to authenticate with Spotify and get the access token
async function authenticateWithSpotify() {
  const clientId = "0d62b3b520ec4b928470f059885ed75c";
  const clientSecret = "59aff701912f4f0185d9c4a14bc8d482";

  // Base64 encode the client ID and client secret
  const encodedAuth = btoa(`${clientId}:${clientSecret}`);

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${encodedAuth}`,
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
    }),
  });

  const data = await response.json();
  return data.access_token;
}

// Function to search for songs on Spotify
async function searchForSong(query) {
  const accessToken = await authenticateWithSpotify();
  const response = await fetch(
    `https://api.spotify.com/v1/search?q=${query}&type=track`,
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );
  const data = await response.json();
  searchResults = data.tracks.items;
  displaySuggestions();
}

// Function to display search suggestions
function displaySuggestions() {
  suggestionsContainer.style.display = "grid";
  suggestionsContainer.innerHTML = "";
  searchResults.forEach((result, index) => {
    const suggestion = document.createElement("div");
    suggestion.style.borderBottom = "1px solid white";
    suggestion.style.cursor = "pointer";
    suggestion.textContent = `${result.name} - ${result.artists[0].name}`;
    suggestion.addEventListener("click", () => playSong(index));
    suggestionsContainer.appendChild(suggestion);
  });
}

// Function to play a selected song
async function playSong(index) {
  const song = searchResults[index];
  currentSongIndex = index;
  musicName.innerHTML = song.name;
  musicArtist.innerHTML = song.artists[0].name;
  audioPlay.src = song.preview_url;
  musicImg.src = song.album.images[0].url;
  audioPlay.play();
  musicPlay.style.display = "none";
  musicPause.style.display = "inline";
}

// Function to update the progress bar
function updateProgressBar() {
  const currentTime = audioPlay.currentTime;
  const duration = audioPlay.duration;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;
  progressHandle.style.left = `${progressPercent}%`;
  currentTimeSpan.textContent = formatTime(currentTime);
  if (!isDragging) {
    requestAnimationFrame(updateProgressBar);
  }
}

// Format the time for display
function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

// Event listener for mouse events to handle progress bar dragging
progressHandle.addEventListener("mousedown", () => {
  isDragging = true;
});

document.addEventListener("mousemove", (e) => {
  if (isDragging) {
    const rect = progressContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = progressContainer.clientWidth;
    const newTime = (offsetX / width) * audioPlay.duration;
    audioPlay.currentTime = Math.max(0, Math.min(newTime, audioPlay.duration));
    updateProgressBar();
  }
});

document.addEventListener("mouseup", () => {
  isDragging = false;
});

// Event listeners for play and pause buttons
musicPlay.addEventListener("click", () => {
  audioPlay.play();
  musicPlay.style.display = "none";
  musicPause.style.display = "inline";
});

musicPause.addEventListener("click", () => {
  audioPlay.pause();
  musicPlay.style.display = "inline";
  musicPause.style.display = "none";
});

// Event listener for the previous button
musicPre.addEventListener("click", () => {
  do {
    currentSongIndex = (currentSongIndex - 1 + searchResults.length) % searchResults.length;
  } while (searchResults[currentSongIndex].preview_url === null);
  playSong(currentSongIndex);
});

// Event listener for the next button
musicNext.addEventListener("click", () => {
  do {
    currentSongIndex = (currentSongIndex + 1) % searchResults.length;
  } while (searchResults[currentSongIndex].preview_url === null);
  playSong(currentSongIndex);
});

// Event listener for shuffle button
musicShuffle.addEventListener("click", () => {
  shuffle = !shuffle;
  musicShuffle.src = shuffle ? "img/shuffle-active.png" : "img/shuffle.png";
});

// Event listener for repeat button
musicRepeat.addEventListener("click", () => {
  repeatState = (repeatState + 1) % 3;
  switch (repeatState) {
    case 0:
      musicRepeat.src = "img/repeat.png";
      break;
    case 1:
      musicRepeat.src = "img/repeat-active.png";
      break;
    case 2:
      musicRepeat.src = "img/repeat-one.png";
      break;
  }
});

// Handle song end event
audioPlay.addEventListener("ended", () => {
  if (repeatState === 2) {
    audioPlay.currentTime = 0;
    audioPlay.play();
  } else {
    let nextSongIndex = (currentSongIndex + 1) % searchResults.length;
    while (searchResults[nextSongIndex].preview_url === null) {
      nextSongIndex = (nextSongIndex + 1) % searchResults.length;
      if (nextSongIndex === currentSongIndex) {
        return;
      }
    }
    playSong(nextSongIndex);
  }
});

// Event listener for the search input field
searchInput.addEventListener("input", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    searchForSong(query);
  } else {
    suggestionsContainer.innerHTML = "";
  }
});

// Hide suggestions when clicking outside
document.body.addEventListener("click", (event) => {
  if (!suggestionsContainer.contains(event.target) && event.target !== searchInput) {
    suggestionsContainer.style.display = "none";
  }
});

// Clear search input on button click
searchClear.addEventListener("click", () => {
  searchInput.value = '';
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
});

// Event listener to update end time on metadata load
audioPlay.addEventListener("loadedmetadata", () => {
  endTimeSpan.textContent = formatTime(audioPlay.duration);
});

// Initially hide the audio element
audioPlay.style.display = "none";

// Play the initial song
playSong(currentSongIndex);
