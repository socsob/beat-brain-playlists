require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const spotifyApiUrl = 'https://api.spotify.com/v1/';
const featuredPlaylistsEndpoint = 'browse/featured-playlists';
const playlistsEnpoint = 'playlists/';
const clientId = process.env.SPOTIFY_CLIENT_ID;
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
const numberOfPlaylists = process.env.NUMBER_OF_PLAYLISTS;


//debugging
const formatJson = process.env.DEBUG_FORMAT_JSON;
const showAllFields = process.env.DEBUG_SHOW_ALL_FIELDS;


const jsonSpace = (formatJson) ? 2 : null;
const featuredPlaylistsFields = (showAllFields) ? '' : 'playlists(items(name,id,external_urls(spotify)))';
const playlistsFields = (showAllFields) ? '' : 'id,name,description,external_urls(spotify),tracks(items(track(id,name,artists(name),explicit,external_urls(spotify))))';

const docsDir = './docs/'
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
        const playlistDetailsPromises = featuredPlaylistsResponse.data.playlists.items.map(playlist =>
            fetchPlaylistDetails(accessToken, playlist));
        const allPlaylistDetails = await Promise.all(playlistDetailsPromises);

        featuredPlaylistsResponse.data.playlists.items.forEach((playlist, index) => {
            playlist.explicit = allPlaylistDetails[index].explicit;
        });

        fs.writeFileSync(`${docsDir}featured-playlists.json`, JSON.stringify(featuredPlaylistsResponse.data, null, jsonSpace));
        console.log('Featured playlists summary has been saved to featured-playlists.json');

        if (fs.existsSync(detailsDir)) {
            clearDirectorySync(detailsDir);
        } else {
            fs.mkdirSync(detailsDir);
        }
        allPlaylistDetails.forEach((details) => {
            const filename = `${detailsDir}/${details.id}.json`;
            fs.writeFileSync(filename, JSON.stringify(details, null, jsonSpace));
            console.log(`Saved ${details.name} details to ${filename}`);
        });
    } catch (error) {
        console.error('Error fetching playlists:', error);
    }
}

//note: caps at first 100 and doesn't fetch next page - works for me
async function fetchPlaylistDetails(accessToken, playlist) {
    try {
        const response = await axios.get(`${spotifyApiUrl}${playlistsEnpoint}${playlist.id}?fields=${playlistsFields}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        response.data.explicit = response.data.tracks.items.some(item => item.track.explicit);
        return response.data;
    } catch (error) {
        console.error('Error fetching playlist details:', error);
        throw error;
    }
}

fetchFeaturedPlaylists();