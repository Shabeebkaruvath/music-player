const audioPlay = document.getElementById("Audio-Player");
const musicPlay = document.getElementById("play");
const musicPause = document.getElementById("pause");
const musicNext = document.getElementById("next");
const musicPre = document.getElementById("pre");
const musicName = document.getElementById("song-name");
const musicArtist = document.getElementById("artist-name");
const musicshuffle = document.getElementById("shuffle");
const musicrepeat = document.getElementById("repeat");
const musicimg = document.getElementById("song-img");
const progressContainer = document.querySelector(".progress-container");
const progressBar = document.querySelector(".progress-bar");
const progress = document.querySelector(".progress");
const progressHandle = document.querySelector(".progress-handle");
const currentTimeSpan = document.querySelector(".current-time");
const endTimeSpan = document.querySelector(".end-time");
const searchclear = document.getElementById("clearButton");


const suggestionsContainer = document.getElementById("suggestions");
suggestionsContainer.style.display = "none";

let currentSongIndex = 0;
let searchResults = [];

async function authenticateWithSpotify() {
  const clientId = "0d62b3b520ec4b928470f059885ed75c";
  const clientSecret = "59aff701912f4f0185d9c4a14bc8d482";
  const redirectUri = "http://127.0.0.1:5500/index.html";
  const scope = "user-read-private user-read-email";

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
  const accessToken = data.access_token;

  return accessToken;
}

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

function displaySuggestions() {
  suggestionsContainer.style.display = "grid";
  suggestionsContainer.innerHTML = "";
  searchResults.forEach((result, index) => {
    const suggestion = document.createElement("div");
    suggestion.style.borderBottom = "1px solid white";
    suggestion.style.cursor ="pointer";
    suggestion.textContent = `${result.name} - ${result.artists[0].name}`;
    suggestion.addEventListener("click", () => playSong(index));
    suggestionsContainer.appendChild(suggestion);
  });
}

async function playSong(index) {
  const song = searchResults[index];
  musicName.innerHTML = song.name;
  musicArtist.innerHTML = song.artists[0].name;
  audioPlay.src = song.preview_url;
  musicimg.src = song.album.images[0].url;
  audioPlay.play();
  musicPlay.style.display = "none";
  musicPause.style.display = "inline";
}


//Song Progress bar funtion
// Song Progress bar function
audioPlay.addEventListener("loadedmetadata", () => {
  // Update the end-time span with the duration of the audio
  endTimeSpan.textContent = formatTime(audioPlay.duration);
});

audioPlay.addEventListener("timeupdate", updateProgressBar);

progressContainer.addEventListener("click", (e) => {
  const clickX = e.offsetX;
  const width = progressContainer.clientWidth;
  const duration = audioPlay.duration;
  audioPlay.currentTime = (clickX / width) * duration;
});

function updateProgressBar() {
  const currentTime = audioPlay.currentTime;
  const duration = audioPlay.duration;
  const progressPercent = (currentTime / duration) * 100;
  progress.style.width = `${progressPercent}%`;
  progressHandle.style.left = `${progressPercent}%`;
  currentTimeSpan.textContent = formatTime(currentTime);

  requestAnimationFrame(updateProgressBar);
}

function formatTime(seconds) {
  const minutes = Math.floor(seconds / 60);
  seconds = Math.floor(seconds % 60);
  if (seconds < 10) {
    seconds = `0${seconds}`;
  }
  return `${minutes}:${seconds}`;
}

let isDragging = false;
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
//Song Progress bar funtion



// Initially hide the audio element
audioPlay.style.display = "none";

// Event listener for the play button
musicPlay.addEventListener("click", () => {
  audioPlay.play();
  musicPlay.style.display = "none";
  musicPause.style.display = "inline";
});

// Event listener for the pause button
musicPause.addEventListener("click", () => {
  audioPlay.pause();
  musicPlay.style.display = "inline";
  musicPause.style.display = "none";
});

// Event listener for the previous button
// Event listener for the previous button
musicPre.addEventListener("click", () => {
  let previousSongIndex = currentSongIndex;

  // Find the previous available song
  do {
    previousSongIndex =
      (previousSongIndex - 1 + searchResults.length) % searchResults.length;
    // If all songs are unavailable, exit the loop
    if (previousSongIndex === currentSongIndex) {
      return;
    }
  } while (searchResults[previousSongIndex].preview_url === null);

  // Update the current song index and play the previous song
  currentSongIndex = previousSongIndex;
  playSong(currentSongIndex);
});

// Initialize shuffle state to true
let shuffle = true;

musicshuffle.addEventListener("click", () => {
  if (shuffle) {
    shuffle = !shuffle;

    musicshuffle.src = "img/shuffle-active.png";
  } else {
    shuffle = !shuffle;

    musicshuffle.src = "img/shuffle.png";
  }
});

// Add an event listener to the music shuffle button
let one = 'img/repeat.png';
let two = 'img/repeat-active.png';
let three = 'img/repeat-one.png';
 

musicrepeat.addEventListener("click", () => {
    const currentSrc = musicrepeat.src.split('/').pop(); // Get only the file name part

    if (currentSrc === one.split('/').pop()) {
        musicrepeat.src = two;
    } else if (currentSrc === two.split('/').pop()) {
        musicrepeat.src = three;
    } else if (currentSrc === three.split('/').pop()) {
        musicrepeat.src = one;
    }
});

// Event listener for the next button
musicNext.addEventListener("click", () => {
  let nextSongIndex = (currentSongIndex + 1) % searchResults.length;

  // Find the next available song
  while (searchResults[nextSongIndex].preview_url === null) {
    nextSongIndex = (nextSongIndex + 1) % searchResults.length;

    // If all songs are unavailable, exit the loop
    if (nextSongIndex === currentSongIndex) {
      return;
    }
  }

  currentSongIndex = nextSongIndex;
  playSong(currentSongIndex);
});

//search function
const searchInput = document.getElementById("search");

// Add an event listener to the input field

searchInput.addEventListener("input", (event) => {
  // Prevent the default form submission behavior
  event.preventDefault();

  // This function will be called when the input field value changes
  const query = searchInput.value;
  if (query) {
    searchForSong(query);
  } else {
    suggestionsContainer.innerHTML = "";
  }
});

document.body.addEventListener("click", (event) => {
  const suggestionDiv = document.getElementById("suggestions");
  // Check if the click target is not inside the suggestion div
  if (!suggestionDiv.contains(event.target) && event.target !== searchInput) {
    // Hide the suggestion div
    suggestionDiv.style.display = "none";
  }
});
audioPlay.addEventListener("ended", () => {
  let nextSongIndex = (currentSongIndex + 1) % searchResults.length;

  // Find the next available song
  while (searchResults[nextSongIndex].preview_url === null) {
    nextSongIndex = (nextSongIndex + 1) % searchResults.length;

    // If all songs are unavailable, exit the loop
    if (nextSongIndex === currentSongIndex) {
      return;
    }
  }

  currentSongIndex = nextSongIndex;
  playSong(currentSongIndex);
});
// Play the initial song

//search bar clear 

searchclear.addEventListener('click', ()=>{
  document.getElementById('search').value = '';
})

playSong(currentSongIndex);
