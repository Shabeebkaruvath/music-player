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
const downloadButton = document.getElementById("download");

suggestionsContainer.style.display = "none";

let currentSongIndex = 0;
let searchResults = [];
let shuffle = false; // Shuffle state
let repeatState = 0; // 0: no repeat, 1: repeat all, 2: repeat one
let searchOffset = 0; // Keep track of the offset for pagination
let isLoading = false; // Flag to prevent multiple simultaneous requests

// Function to authenticate with Spotify and get the access token
async function authenticateWithSpotify() {
  const clientId = "0d62b3b520ec4b928470f059885ed75c";
  const clientSecret = "59aff701912f4f0185d9c4a14bc8d482";
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
    `https://api.spotify.com/v1/search?q=${query}&type=track&limit=20&offset=${searchOffset}`,
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
  isLoading = false; // Reset loading flag after displaying suggestions
}

// Event listener for the search input field
searchInput.addEventListener("input", (event) => {
  event.preventDefault();
  const query = searchInput.value.trim();
  if (query) {
    searchOffset = 0; // Reset offset when new search is performed
    suggestionsContainer.innerHTML = ""; // Clear previous suggestions
    searchForSong(query);
  } else {
    suggestionsContainer.innerHTML = "";
    downloadButton.style.display = "none"; // Hide download button when there's no search
  }
});

// Function to load more suggestions
function loadMoreSuggestions() {
  searchOffset += 20; // Increment offset to load next page of results
  const query = searchInput.value.trim();
  if (query) {
    searchForSong(query);
  }
}

// Add scroll event listener to window
window.addEventListener('scroll', () => {
  if (!isLoading && (window.innerHeight + window.scrollY >= document.body.offsetHeight)) {
    isLoading = true;
    loadMoreSuggestions();
  }
});

// Function to handle song download
function downloadSong(url, name) {
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
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

  // Show download button when a song is played
  if (song.preview_url) {
    downloadButton.style.display = "inline";
    downloadButton.onclick = () => downloadSong(song.preview_url, `${song.name}.mp3`);
  } else {
    downloadButton.style.display = "none";
  }

  // Hide suggestions when a song is played
  suggestionsContainer.style.display = "none";
}

// Function to update the progress bar
let isDragging = false;

audioPlay.addEventListener('loadedmetadata', () => {
  endTimeSpan.textContent = formatTime(audioPlay.duration);
});

audioPlay.addEventListener('timeupdate', () => {
  updateProgressBar();
});

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
progressHandle.addEventListener('mousedown', () => {
  isDragging = true;
});

document.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const rect = progressContainer.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const width = progressContainer.clientWidth;
    const newTime = (offsetX / width) * audioPlay.duration;
    audioPlay.currentTime = Math.max(0, Math.min(newTime, audioPlay.duration));
    updateProgressBar();
  }
});

document.addEventListener('mouseup', () => {
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

// Function to handle song end event
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

// Clear search input on button click
searchClear.addEventListener("click", () => {
  searchInput.value = '';
  suggestionsContainer.innerHTML = "";
  suggestionsContainer.style.display = "none";
});

// Initially hide the audio element
audioPlay.style.display = "none";

document.addEventListener('focusin', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
  }
});

document.addEventListener('focusout', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
    document.body.style.position = '';
    document.body.style.width = '';
  }
});


// Function to show a custom notification with playback controls
function showNotification(title, artist, albumArtUrl) {
  const notification = new Notification("Now Playing", {
    body: `${song.name} - ${song.artists[0].name}`,
    icon: albumArtUrl,
    actions: [
      { action: "play", title: "Play", icon: "play.png" },
      { action: "pause", title: "Pause", icon: "pause.png" },
      { action: "next", title: "Next", icon: "next.png" },
      { action: "previous", title: "Previous", icon: "previous.png" }
    ]
  });

  // Event listener for notification button clicks
  notification.addEventListener("click", handleNotificationClick);
}

// Function to handle notification button clicks
function handleNotificationClick(event) {
  const action = event.action;
  switch (action) {
    case "play":
      playSong();
      break;
    case "pause":
      pauseSong();
      break;
    case "next":
      playNextSong();
      break;
    case "previous":
      playPreviousSong();
      break;
    default:
      // Handle other actions
      break;
  }
}

b

// Example usage
showNotification("Song Title", "Artist Name", "album-art.jpg");





// Play the initial song
playSong(currentSongIndex);
