# 2015blueironhack-enhsin
#### Problem:
Find a safe and green place to rent in West Lafayette/Lafayette area.

#### Data Sources:
* Apartment listing: [Craigslist](https://tippecanoe.craigslist.org/search/apa).
* Local crime data: [CrimeReports](https://www.crimereports.com), from police logs submitted by Lafayette and West Lafayette police departments.
* Google Maps API: distance matrix, geocoding.
* Map icons: [Map Icons Collection](https://mapicons.mapsmarker.com/).

#### Description:
The page shows available housing (pre-processed from Craigslist) on the Google map. Users can select their work places or schools from the dropdown menu or enter a new address on the top. The default work place is Purdue Union (marked as a star). Two histograms on the left show the distribution of the commuting distance from the individual housing to the work place and the crime rate of the neighborhood of the housing. Users can move the red vertical bar on the histogram to refine the search.

#### Installation:
The html page can be loaded directly in Firefox. For Chrome, a basic HTTP server is required.  
For example,
```
python -m SimpleHTTPServer 8008
```
Then open the link [http://localhost:8008/index.html](http://localhost:8008/index.html) in the browser.

#### Keywords:
Apartments/housing rentals, West Lafayette/Lafayette, Indiana, Crime data

#### Author:
En-Hsin Peng (epeng@purdue.edu)
