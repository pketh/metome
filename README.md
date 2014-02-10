# Metome

<img src="http://payload213.cargocollective.com/1/0/1410/6574080/prt_200x280_1382296449.jpg">

Metome was designed to be a simple, private personal diary service. It's a real time, single page app for non-social, personal writing. It's a side-project of mine that I've decided to [walk away from for now][blogpost].

I haven't gotten around to actually implementing a real front-end, but here's a bit of what the end design would've looked like.

<img src="https://dl.dropboxusercontent.com/u/366007/metome-sample.png">

[(more screens)][pketh]

I decided to open source the code for future reference. Who knows? it may be something useful to learn from (especially the image upload stuff).

It's not a complete [sunk cost][wiki] though.

Diving head first into the world of servers, I learned about:

- Mongodb crud operations
- Socket.io for real time user data saving and DOM manipulation
- Node.JS (and the awesomeness of NPM)

On the design side I gained an appreciation for the challenges of:

- Designing low friction forms
- Software pricing models
- Typography on the web
- Real time, single page app (SPA) design

## Starting it up
	$ mongod
	$ node server.js
	http://localhost:3000/metome.html <-- temporary app url


[blogpost]:http://pketh.github.io/2014/02/09/walking-away.html
[wiki]:http://en.wikipedia.org/wiki/Sunk_costs
[pketh]:http://pketh.org/Metome-Journal
