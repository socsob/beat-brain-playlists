require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const featuredPlaylistsEndpoint = 'browse/featured-playlists';
const playlistsEnpoint = 'playlists/';
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

const numberOfPlaylists = 10;
const debug = false;

const jsonSpace = (debug) ? 2 : null;
const featuredPlaylistsFields = (debug) ? '' : 'playlists(items(name,id,external_urls(spotify)))';
const playlistsFields = (debug) ? '' : 'name,description,external_urls(spotify),tracks(items(track(id,name,artists(name),external_urls(spotify))))';

const detailsDir = './playlist_details';

if (fs.existsSync(detailsDir)) {
    clearDirectory(detailsDir);
} else {
    fs.mkdirSync(detailsDir);
}

function clearDirectory(directory) {
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
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
        const accessToken = await getAccessToken();
        const featuredPlaylistsResponse = await axios.get(`${spotifyApiUrl}${featuredPlaylistsEndpoint}?limit=${numberOfPlaylists}&fields=${featuredPlaylistsFields}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        fs.writeFileSync('featured-playlists.json', JSON.stringify(featuredPlaylistsResponse.data, null, jsonSpace));
        console.log('Featured playlists summary has been saved to featured-playlists.json');

        await Promise.all(featuredPlaylistsResponse.data.playlists.items.map(playlist =>
            fetchPlaylistDetails(accessToken, playlist)));
    } catch (error) {
        console.error('Error fetching featured playlists:', error);
    }
}

//note: caps at first 100 and doesn't fetch next page - works for me
async function fetchPlaylistDetails(accessToken, playlist) {
    try {
        const response = await axios.get(`${spotifyApiUrl}${playlistsEnpoint}${playlist.id}?market=US&fields=${playlistsFields}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        const filename = `${detailsDir}/${playlist.id}.json`;
        fs.writeFileSync(filename, JSON.stringify(response.data, null, jsonSpace));
        console.log(`Saved ${playlist.name} details to ${filename}`);
    } catch (error) {
        console.error('Error fetching playlist details:', error);
    }
}

fetchFeaturedPlaylists();