const audioPlay = document.getElementById("Audio-Player");
const musicPlay = document.getElementById("play");
const musicPause = document.getElementById("pause");
const musicNext = document.getElementById("next");
const musicPre = document.getElementById("pre");
const musicName = document.getElementById("song-name");
const musicArtist = document.getElementById("artist-name");
const musicshuffle = document.getElementById("shuffle");
const musicimg = document.getElementById("song-img");


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
  musicimg.src = song.album.images[0].url;;
  audioPlay.play();
  musicPlay.style.display = "none";
  musicPause.style.display = "inline";
}

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
musicPre.addEventListener('click', () => {
  let previousSongIndex = currentSongIndex;
  
  // Find the previous available song
  do {
      previousSongIndex = (previousSongIndex - 1 + searchResults.length) % searchResults.length;
      // If all songs are unavailable, exit the loop
      if (previousSongIndex === currentSongIndex) {
          return;
      }
  } while (searchResults[previousSongIndex].preview_url === null);

  // Update the current song index and play the previous song
  currentSongIndex = previousSongIndex;
  playSong(currentSongIndex);
});





musicshuffle.addEventListener('click', () => {
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

// Event listener for the next button
musicNext.addEventListener('click', () => {
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

document.body.addEventListener('click', (event) => {
  const suggestionDiv = document.getElementById('suggestions');
  // Check if the click target is not inside the suggestion div
  if (!suggestionDiv.contains(event.target) && event.target !== searchInput) {
      // Hide the suggestion div
      suggestionDiv.style.display = 'none';
  }
});
audioPlay.addEventListener('ended', () => {
  // Increment the current song index
  currentSongIndex = (currentSongIndex + 1) % searchResults.length;
  // Play the next song
  playSong(currentSongIndex);
});
// Play the initial song





playSong(currentSongIndex);
