import json
import requests
import time, math, datetime
from collections import defaultdict
import sys, os

today = datetime.date.today()
while today.weekday() != 0:
    today += datetime.timedelta(1)
second = datetime.datetime(today.year,today.month,today.day,8,0,0).strftime("%s")

def geocode(address):
    query = '+'.join(address.split())
    url = 'https://maps.googleapis.com/maps/api/geocode/json?address='+query
    time.sleep(5)
    data = json.loads(requests.get(url).text)
    lat = data["results"][0]["geometry"]["location"]["lat"]
    lng = data["results"][0]["geometry"]["location"]["lng"]
    return lat, lng

def addDestination(data):
    if data.get('destination') is None:
        data['destination'] = []
    #union, ivy, hh, subaru, caterpillar
    destAddress = ['128 Memorial Mall, West Lafayette, IN 47907', '3101 South Creasy Lane, Lafayette, IN 47905', '1200 N Salisbury St, West Lafayette, IN 47906', '5500 IN-38, Lafayette, IN 47905', '3701 State Rd 26 E, Lafayette, IN 47905']
    destStr = ''
    for i, a in enumerate(destAddress):
        print a
        lat, lng = geocode(a)
        data['destination'].append({'lat': lat, 'lng': lng})
        destStr += '%.8f,%.8f|' % (lat, lng)
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
        d['distance'].append(result['rows'][0]['elements'][i]['distance']['value']*0.621371/1000.) #m to mi
        print d['distance'][-1]

def calcTransitRoute(d, destStr):
    mi = 0.621371/1000.
    deg2miLat = R0*1000.*mi*2*math.pi/360
    deg2miLng = deg2miLat*math.cos(d['lat']/180.*math.pi)
    dest = destStr.split('|')
    url = 'https://maps.googleapis.com/maps/api/directions/json?mode=transit&arrival_time='+str(second)
    url += '&origin=' + str(d['lat']) + ',' + str(d['lng']) + '&destination='
    if d.get('transit') is None:
        d['transit'] = []
        d['bus_stop'] = []
        d['bus_stop_dist'] = []

    for dt in dest:
        url1 = url + dt
        print url1
        time.sleep(2)
        result = json.loads(requests.get(url1).text)
        if result['status'] == 'OK':
            steps = result['routes'][0]['legs'][0]['steps']
            t={'distance': {'value': result['routes'][0]['legs'][0]['distance']['value']},
                    'duration': {'value': result['routes'][0]['legs'][0]['duration']['value']}}
            t['steps'] = []
            steps = result['routes'][0]['legs'][0]['steps']
            for i, s in enumerate(steps):
                if i==0:
                    if s['travel_mode'] == "TRANSIT":
                        stopId = s['transit_details']['departure_stop']['name'].split(':')[1].strip()
                        stopAdd = s['transit_details']['departure_stop']['name'].split(":")[0].strip()
                        b = s['transit_details']['departure_stop']['location']
                        x = (d['lat']-b['lat'])*deg2miLat
                        y = (d['lng']-b['lng'])*deg2miLng
                        r = (x**2+y**2)**0.5
                    else:
                        if 'BUS' in s['html_instructions']:
                            stopId = s['html_instructions'].split(':')[1].strip()
                            stopAdd = s['html_instructions'].split(":")[0].split(" to ")[1].strip()
                            r = s['distance']['value']*mi
                        #else:
                        #    r, stopId, stopAdd = findBusStop(d)

                t1 = {'instructions': s['html_instructions'], 'travel_mode': s['travel_mode'],
                        'duration': {'text': s['duration']["text"], 'value': s['duration']["value"]},
                        'distance': {'text': s['distance']['text'], 'value': s['distance']['value']}}
                if s['travel_mode'] == "TRANSIT":
                    t1['transit'] = {'line': {'short_name': s['transit_details']['line']['short_name']}}
                t['steps'].append(t1)
        elif result['status'] == 'ZERO_RESULTS':
            #r, stopId, stopAdd = findBusStop(d)
            t={'distance': {'text': '', 'value': 0}, 'duration': {'text': '', 'value': 0}}
            t['steps'] = []
        else:
            print result['status'], result['error_message']
            sys.exit()

        d['transit'].append(t)
        print d['transit'][-1]
        #if r > 0.189:
        #    d['bus_stop'].append('%s, %s (%.1f mi)' % (stopId, stopAdd, r))
        #else:
        #    d['bus_stop'].append('%s, %s (%.0f ft)' % (stopId, stopAdd, r*5280.))
        #d['bus_stop_dist'].append(r)


def loadBusStation():
    with open('bus.json', 'r') as infile:
        data = json.load(infile)
    busStation = []
    for d in data['results']:
        bus = {'name': d['name'], 'lat': d['geometry']['location']['lat'] , 'lng': d['geometry']['location']['lng']}
        busStation.append(bus)
    return busStation

def findBusStop(d):
    deg2mLat = R0*1000*2*math.pi/360
    deg2mLng = deg2mLat*math.cos(d['lat']/180.*math.pi)
    minr = 100
    mi = 0.000621371
    for b in busStation:
        x = (d['lat']-b['lat'])*deg2mLat
        y = (d['lng']-b['lng'])*deg2mLng
        r = (x**2+y**2)**0.5*mi
        if r<minr:
            minr = r
            busStop = b['name']
    stopId = busStop.split(':')[1].strip()
    stopAdd = busStop.split(':')[0].strip()
    return minr, stopId, stopAdd

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

def processData(inputFile, outputFile, overwrite=False):
    lat0 = 40.4240
    lng0 = -86.9290
    bsize = 20
    addressId = defaultdict(bool)
    data = {}
    data['results'] = []
    count = 0
    if os.path.exists(outputFile):
        if not overwrite:
            with open(outputFile, 'r') as infile:
                data0 = json.load(infile)
            for d in data0['results']:
                count += 1
                addressId[d['place_id']] = True
                data['results'].append(d)

    with open(inputFile, 'r') as infile:
        data0 = json.load(infile)
    destStr, n = addDestination(data)
    crimeMap = makeCrimeMap(lat0, lng0, bsize)
    #global busStation
    #busStation = loadBusStation()
    for d in data0['results']:
        if addressId.get(d['place_id']) is not None or d['lat'] == 0:
            continue
        addressId[d['place_id']] = True
        calcDistance(d, destStr, n)
        calcCrime(d, lat0, lng0, bsize, crimeMap)
        calcTransitRoute(d, destStr)
        print count, d['address'], d['crime_rate'], d['distance'][0], d['transit'][0]['steps'][0]['instructions']
        data['results'].append(d)
        count += 1
        with open(outputFile, 'w') as outfile:
            json.dump(data, outfile)


def reProcessData(inputFile, outputFile):
    addressId = defaultdict(bool)
    data = {}
    data['results'] = []
    with open(outputFile, 'r') as infile:
        data0 = json.load(infile)
    for d in data0['results']:
        redo = False
        for b in d['bus_stop']:
             s =b.split(',')[1].split('(')[0]
             if len(s)<10 and len(s)>1:
                 redo = True
                 print b
        if not redo:
            data['results'].append(d)
        else:
            print d

    with open(outputFile, 'w') as outfile:
        json.dump(data, outfile)


R0 = 6371
#reProcessData('craigslist.json','processed.json')
processData('craigslist.json','processed.json')
