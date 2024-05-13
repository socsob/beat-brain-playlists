# Beat Brain Playlists

Serves information on current Spotify featured playlists

## Description

Using GitHub Actions, serves and automatically updates the current JSON of featured playlists from the [Spotify Web API](https://developer.spotify.com/documentation/web-api). Please see [Spotify Developer Terms](https://developer.spotify.com/terms) regarding usage of their API. The information is updated daily and served with GitHub Pages.

## Setting up
Install depedencies:

`npm install`

Create .env at root of the project with the following variables:

`SPOTIFY_CLIENT_ID` `SPOTIFY_CLIENT_SECRET`(from Spotify Developer panel)
`NUMBER_OF_PLAYLISTS` (int)

If you are using github actions, you will need to configure these variables within Github as well.

Run the project with:

`node app.js`

## Information

I created this for a particular personal use case. If you have a similar problem to solve using GitHub (a free proxy for an API along with serving the cached data) feel free to see if this can help.

## Authors

* Socsob

## License

This project is licensed under the MIT License - see the LICENSE.md file for details

## Acknowledgments

* [Spotify Web API](https://developer.spotify.com/documentation/web-api) - usage of Spotify retrieve data. I do not own any of the Spotify Content.
