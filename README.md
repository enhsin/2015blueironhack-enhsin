# 2015blueironhack-enhsin
#### Problem:
Find a safe and green place to rent in West Lafayette/Lafayette area.

#### Data Sources:
* Apartment listing: [Craigslist](https://tippecanoe.craigslist.org/search/apa).
* Local crime data: [CrimeReports](https://www.crimereports.com), from police logs submitted by Lafayette and West Lafayette police departments. I calculated the crime rate as the weighted average number of incidents within 20m x 20m region in the past 6 months, which is all the data that is publicly available from crimereports.com. I used distance inverse as the weight. Note that apartment complexes may have a higher crime rate since all the incidence pointed to the same address (no apartment number in the data).
* Climate data: NOAA [Climate Data Online](http://www.ncdc.noaa.gov/cdo-web/datasets). I downloaded 2014 monthly summaries for city of Lafayette.
* School districts: [TIGER/Line Shapefile by U.S. Census Bureau] (http://catalog.data.gov/dataset/tiger-line-shapefile-2014-state-indiana-current-unified-school-districts-state-based-shapefile), downloaded through data.gov. I used [Quantum GIS](http://www.qgis.org/en/site/) to convert shapefile to KML file. Then I imported it to Google Fusion Tables and added the school boundary layer to the map. We can use the boundary file to determine whether a housing is within a school district (not implemented yet).
* Google Maps API: distance matrix, geocoding, and directions.
* Map icons: [Map Icons Collection](https://mapicons.mapsmarker.com/).

#### Description:
The page shows available housing (pre-processed from Craigslist) on the Google map. Users can select their work places or schools from the dropdown menu or enter a new address on the top. The default work place is Purdue Union (marked as a star on the map). Two histograms on the left show the distribution of the commuting distance from the individual housing to the work place and the crime rate of the neighborhood of the housing. Users can move the slidder on the upper right of the graph to refine the search. Details of the housing will be shown on the left when the marker is clicked. If the public transit checkbox is checked, a transit time histogram will be shown. Transit route will be displayed in the housing detail panel. Note that some routes still need 10 minutes or less of driving (or taxiing). 'Living in Greater Lafayette' panel gives some quick facts about the city, such as the average climate and school systems.

#### Installation:
The html page can be loaded directly in Firefox. For Chrome, a basic HTTP server is required.  
For example,
```
python -m SimpleHTTPServer 8008
```
Then open the link [http://localhost:8008/index.html](http://localhost:8008/index.html) in the browser.

#### Keywords:
Apartments/housing rentals, West Lafayette/Lafayette, Indiana, Crime data, NOAA, Google Maps

#### Author:
En-Hsin Peng (epeng@purdue.edu)
