# newsspec-10822: 2015 turnout maps

2015 Election - turnout maps

## Getting started

Set up the project

```
grunt
```

Update the data

<sub>Grab a local copy of the input data from the following feed:
https://general-election-2015.api.bbci.co.uk/report/resultsTurnout
save it as a .json file and bosh it in the /inputData directory. The data task writes out the output data to /source/js/data/mapData.js</sub>

```
grunt data
```

Make images responsive

```
grunt images
```

Build World Service version

```
grunt translate
```

## iFrame scaffold

This project was built using the iFrame scaffold v1.6.2

## License
Copyright (c) 2014 BBC
