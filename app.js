require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const playlistsEnpoint = 'playlists/';
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const playlistIdString = process.env.PLAYLIST_IDS;
const playlistIds = playlistIdString
.split(',')
.map(item => item.trim())
.filter(item => item.length > 0);


//debugging
const formatJson = process.env.DEBUG_FORMAT_JSON;
const showAllFields = process.env.DEBUG_SHOW_ALL_FIELDS;


const jsonSpace = (formatJson) ? 2 : null;
const playlistsFields = (showAllFields) ? '' : 'id,name,description,external_urls(spotify),tracks(items(track(id,name,artists(name),explicit,external_urls(spotify))))';

const docsDir = './docs/'
const logFilePath = `${docsDir}log.txt`;
const detailsDir = `${docsDir}playlist_details/`;

if (!fs.existsSync(docsDir)){
    fs.mkdirSync(docsDir);
}

function clearDirectorySync(directory) {
    const files = fs.readdirSync(directory);
    for (const file of files) {
        fs.unlinkSync(path.join(directory, file));
    }
}

//logging sync currently - could be optimized
function logMessage(message) {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}\n`;

    fs.appendFileSync(logFilePath, logEntry, (err) => {
        if (err) {
            console.error('Failed to write to log file:', err);
        }
    });
}

async function getAccessToken() {
    const response = await axios({
        url: 'https://accounts.spotify.com/api/token',
        method: 'post',
        params: {
            grant_type: 'client_credentials'
        },
        auth: {
            username: clientId,
            password: clientSecret
        }
    });
    return response.data.access_token;
}

async function fetchFeaturedPlaylists() {
    try {
        fs.writeFileSync(logFilePath, 'Application started...\n')
        const accessToken = await getAccessToken();
        const playlistDetailsPromises = playlistIds.map(id =>
            fetchPlaylistDetails(accessToken, id));
        const allPlaylistDetails = (await Promise.all(playlistDetailsPromises)).filter(p => p != null);

        const featuredPlaylists = allPlaylistDetails.map((playlist) => {
            const { id,name,description,external_urls,explicit } = playlist;
            playlistSnippet = { id,name,description,external_urls,explicit };
            return playlistSnippet;
        })

        fs.writeFileSync(`${docsDir}featured-playlists.json`, JSON.stringify(featuredPlaylists, null, jsonSpace));
        logMessage('Featured playlists summary has been saved to featured-playlists.json');

        if (fs.existsSync(detailsDir)) {
            clearDirectorySync(detailsDir);
        } else {
            fs.mkdirSync(detailsDir);
        }
        allPlaylistDetails.forEach((details) => {
            const filename = `${detailsDir}${details.id}.json`;
            fs.writeFileSync(filename, JSON.stringify(details, null, jsonSpace));
            logMessage(`Saved ${details.name} details to ${filename}`);
        });
    } catch (error) {
        logMessage(error);
    }
}

//note: caps at first 100 and doesn't fetch next page - works for me
async function fetchPlaylistDetails(accessToken, id) {
    try {
        const response = await axios.get(`${spotifyApiUrl}${playlistsEnpoint}${id}?fields=${playlistsFields}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        response.data.explicit = response.data.tracks.items.some(item => item.track.explicit);
        return response.data;
    } catch (error) {
        logMessage(`Failed fetching playlist with id: ${id} because of error: ${error.message}`);
        return null;
    }
}

fetchFeaturedPlaylists();