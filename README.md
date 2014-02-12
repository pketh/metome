# Metome

<img src="http://payload213.cargocollective.com/1/0/1410/6574080/prt_200x280_1382296449.jpg">

Metome was designed to be a simple, private personal diary app. It's a real time, single page app for non-social, personal writing. It's a side-project of mine that I've decided to [walk away from for now][blogpost].

I decided to open source the code for future reference. Who knows? it may be something useful to learn from (especially the image upload stuff).

I hadn't gotten around to actually implementing a real front-end, but here was the [planned design][pketh].

It's not a complete [sunk cost][wiki] though. I learned a lot , and even got a job through it. But it's not like I have no regrets. I wrote a bit about how I decided that the time was right to throw in the towel [on my blog][blogpost].

## Starting it up
	$ mongod
	$ node server.js
	http://localhost:3000/metome.html <-- temporary app url

## Broadly, what's left to do is

- authenticating socket connections
- client side polish

(There's plenty of other stuff in the [issue tracker][issues] too.)

[blogpost]:http://pketh.github.io/2014/02/09/walking-away.html
[wiki]:http://en.wikipedia.org/wiki/Sunk_costs
[pketh]:http://pketh.org/Metome-Journal
[issues]:https://github.com/pketh/Metome/issues