import json

"""

point_in_poly uses the Ray Casting Method to determine if a point is inside of a polygon. The python code is from
http://geospatialpython.com/2011/01/point-in-polygon.html
http://geospatialpython.com/2011/08/point-in-polygon-2-on-line.html

some other information about point in polygon I find it useful:
https://en.wikipedia.org/wiki/Point_in_polygon
http://stackoverflow.com/questions/16625507/python-checking-if-point-is-inside-a-polygon

"""

def point_in_poly(x,y,poly):

   # check if point is a vertex
   if (x,y) in poly: return "IN"

   # check if point is on a boundary
   for i in range(len(poly)):
      p1 = None
      p2 = None
      if i==0:
         p1 = poly[0]
         p2 = poly[1]
      else:
         p1 = poly[i-1]
         p2 = poly[i]
      if p1[1] == p2[1] and p1[1] == y and x > min(p1[0], p2[0]) and x < max(p1[0], p2[0]):
         return "IN"

   n = len(poly)
   inside = False

   p1x,p1y = poly[0]
   for i in range(n+1):
      p2x,p2y = poly[i % n]
      if y > min(p1y,p2y):
         if y <= max(p1y,p2y):
            if x <= max(p1x,p2x):
               if p1y != p2y:
                  xints = (y-p1y)*(p2x-p1x)/(p2y-p1y)+p1x
               if p1x == p2x or x <= xints:
                  inside = not inside
      p1x,p1y = p2x,p2y

   if inside: return "IN"
   else: return "OUT"

def findSchool(lat,lng):
    if point_in_poly(lng,lat,polyL) == "IN":
        school = 1 # Lafayette
    elif point_in_poly(lng,lat,polyWL) == "IN":
        school = 2 # West Lafayette
    else:
        school = 3
    return school

def loadSchool():
    global polyL, polyWL
    f=open('school.kml').readlines()
    polyWL=[(float(s.split(',')[0]), float(s.split(',')[1])) for s in f[79].split('dinates>')[1].split('<')[0].split()]
    polyL=[(float(s.split(',')[0]), float(s.split(',')[1])) for s in f[39].split('dinates>')[1].split('<')[0].split()]

def addSchoolDistrict(inputFile, outputFile):
    loadSchool()
    with open(inputFile, 'r') as infile:
        data0 = json.load(infile)

    data = {}
    data['results'] = []
    data['destination'] = data0['destination']
    for d in data0['results']:
        d['school'] = findSchool(d['lat'],d['lng'])
        print d['school'], d['address']
        data['results'].append(d)

    with open(outputFile, 'w') as outfile:
        json.dump(data, outfile)

if __name__=="__main__":
    addSchoolDistrict('processed.json','processed2.json')
