import json
import requests
import time, math
from collections import defaultdict

def geocode(address):
    query = '+'.join(address.split())
    url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+query
    time.sleep(3)
    data = json.loads(requests.get(url).text)
    lat = data["results"][0]["geometry"]["location"]["lat"]
    lng = data["results"][0]["geometry"]["location"]["lng"]
    return lat, lng

def addDestination(data):
    if data.get('destination') is None:
        data['destination'] = []
    destAddress = ['101 N Grant St, West Lafayette, IN 47906, USA', '128 Memorial Mall, West Lafayette, IN 47907', '1200 N Salisbury St, West Lafayette, IN 47906']
    destStr = ''
    for i, a in enumerate(destAddress):
        print a
        lat, lng = geocode(a)
        data['destination'].append({'lat': lat, 'lng': lng})
        destStr += '%g,%g|' % (lat, lng)
    destStr=destStr[0:-1]
    print destStr
    return destStr, len(destAddress)

def calcDistance(d, destStr, n):
    url = 'https://maps.googleapis.com/maps/api/distancematrix/json?origins='
    url += str(d['lat']) + ',' + str(d['lng']) + '&destinations=' + destStr
    time.sleep(3)
    result = json.loads(requests.get(url).text)
    print result['status']
    if d.get('distance') is None:
        d['distance'] = []
    for i in range(n):
        d['distance'].append(result['rows'][0]['elements'][i]['distance']['value'])
        print d['distance'][-1]

def makeCrimeMap(lat0, lng0, bsize):
    deg2mLat = R0*1000*2*math.pi/360
    deg2mLng = deg2mLat*math.cos(lat0/180.*math.pi)
    count = defaultdict(int)
    minx, maxx = 1, -1
    miny, maxy = 1, -1
    with open('crime.json', 'r') as infile:
        data = json.load(infile)
    print len(data['results'])
    for d in data['results']:
        if d['lat'] == 0:
            continue
        x = int(math.floor((d['lat']-lat0)*deg2mLat/bsize))
        y = int(math.floor((d['lng']-lng0)*deg2mLng/bsize))
        count[(x,y)]+=1
        minx = min(minx,x)
        miny = min(miny,y)
        maxx = max(maxx,x)
        maxy = max(maxy,y)
    print minx, miny, maxx, maxy
    return count

def calcCrime(d, lat0, lng0, bsize, crimeMap):
    deg2mLat = R0*1000*2*math.pi/360
    deg2mLng = deg2mLat*math.cos(lat0/180.*math.pi)
    x = int(math.floor((d['lat']-lat0)*deg2mLat/bsize))
    y = int(math.floor((d['lng']-lng0)*deg2mLng/bsize))
    count = 0.
    weight = 0.
    for i in range(-19,20):       #400m
        for j in range(-19,20):
            w = 1./(1+math.sqrt(i*i+j*j))
            if crimeMap.get((x+i,y+j)) is not None:
                count += crimeMap[(x+i,y+j)]*w
            weight += w
    d['crime_rate'] = count/weight


def processData(inputFile, outputFile):
    lat0 = 40.4240
    lng0 = -86.9290
    bsize = 20
    addressId = defaultdict(bool)
    data = {}
    data['results'] = []
    with open(inputFile, 'r') as infile:
        data0 = json.load(infile)

    destStr, n = addDestination(data)
    data['destination'] = data0['destination']
    crimeMap = makeCrimeMap(lat0, lng0, bsize)
    for d in data0['results']:
        if addressId.get(d['place_id']) is not None or d['lat'] == 0:
            continue
        addressId[d['place_id']] = True
        calcDistance(d, destStr, n)
        calcCrime(d, lat0, lng0, bsize, crimeMap)
        print d['address'], d['crime_rate']
        data['results'].append(d)

    with open(outputFile, 'w') as outfile:
        json.dump(data, outfile)


R0 = 6371
processData('craigslist.json','processed.json')
