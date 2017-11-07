# Mulehouse

To publish to **Chrome**:
- Update the version in `manifest.json`
- Compress the folder to create `mulehouse.zip`
- Submit to https://chrome.google.com/webstore/developer/dashboard
It will be available at https://chrome.google.com/webstore/detail/mulehouse-greenhouse-scor/jbjdbhbofcfmeenfjigdbbnklohgoiia

To publish to **Firefox** (from Mac):
- Update the version in `manifest.json`
- Create a copy of the folder called `mulehouse-clean`
- Open `mulehouse-clean` in Console and `rm -rf .git`
- Remove, from `mulehouse-clean`, also the `README.md` file and optionally all the images
- Select all the remaining files in the folder and compress to create `archive.zip`
- Submit to https://addons.mozilla.org/en-US/developers/addons
- It will be available at https://addons.mozilla.org/en-US/firefox/addon/mulehouse/
