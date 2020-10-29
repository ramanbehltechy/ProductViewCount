const express = require('express');
const MongoClient = require('mongodb').MongoClient;
const moment= require('moment') 
const app = express();
var bodyParser = require("body-parser"); 
var connectionString = "mongodb://localhost:27017/";
app.set("view engine", "ejs"); 
app.set("views", __dirname + "/views"); 
app.use(bodyParser.urlencoded({ extended: false })); 
app.listen(3000, function() {
  console.log('listening on 3000')
})
app.get('/', (req, res) => {
  MongoClient.connect(connectionString, function(err, db) {
    if (err) throw err;
    var dbo = db.db("products");
    dbo.collection('productsList').aggregate( 
      { $unwind: "$ProductId" }, 
      { $group: { "_id": "$ProductId", "count": { $sum: 1 } } }, 
      { $project: { "ProductName": "$_id", "count": 1 } }
    ).toArray().then(results => {
          res.render("index", { data: results , isCustom:false});
        })
        .catch(error => console.error(error))
  });
});
app.get('/product', (req, res) => {
 MongoClient.connect(connectionString, function(err, database) {
  var productList=[];
  if (err) throw err;
  var dbo = database.db("products");
  var EndDate =req.query.EndDate ;
  var StartDate =req.query.StartDate;
  var query = {'ProductId':req.query.ProductName,"ViewDate" : { $gte : new Date(StartDate), "$lte" :new Date(EndDate) }} ;
  dbo.collection('productsList').find(query).toArray()
    .then(results => {
      let ProductDetails= []; 
      ProductDetails.push(results);
      var prductsArray = [];  
      prductsArray=results;
      let selectedOption = req.query.viewDate;
      if(selectedOption=="Monthly")
      {
          var MonthsArray=GetMonths(StartDate,EndDate);
          MonthsArray.forEach(element => {
              var lastDay = moment(element).format("YYYY-MM-") + moment(element).daysInMonth();
              var FirstDay= moment(element).format("YYYY-MM-01") ;
              var Interval= FirstDay +" to "+lastDay;
              CalculateViewCount(prductsArray,FirstDay,lastDay,productList,Interval, req.query.ProductName);
          });
          res.render("Product", { data: productList });
      }
      else if(selectedOption=="Weekly")
      {
          var weeksArray= GetWeeks(StartDate,EndDate);
          weeksArray.forEach(element => {
              var lastDay =element[1];
              var FirstDay= element[0]; 
              var Interval= FirstDay+ " to "+ lastDay ;
              CalculateViewCount(prductsArray,FirstDay,lastDay,productList,Interval, req.query.ProductName);
          });
          res.render("Product", { data: productList });
      }
      else if(selectedOption=="Daily")
      {
          var daysArray=  GetDays(StartDate,EndDate);
          daysArray.forEach(element => {
              var lastDay =element;
              var FirstDay= element ;
              var Interval= element;
              CalculateViewCount(prductsArray,FirstDay,lastDay,productList,Interval, req.query.ProductName);
          });
          res.render("Product", { data: productList });
      }
      else if(selectedOption=="Custom")
      {
          var lastDay =StartDate;
          var FirstDay= StartDate ;
          CalculateViewCount(prductsArray,FirstDay,lastDay,productList,StartDate, req.query.ProductName);
          res.render("Product", { data: productList });
      }
    })
    .catch(error => console.error(error))
});
})


function CalculateViewCount(prductsArray,firstDay,lastDay,productList,interval,productName)
{
    var filterData=  prductsArray;
    var obj= new Object();
    let start = moment(firstDay).format("YYYY-MM-DD");
    let end   = moment(lastDay).format("YYYY-MM-DD");
    var Totalcount=filterData.filter(item => {
        let date = moment(item.ViewDate).format("YYYY-MM-DD");
        return date >= start && date <= end;
    });
    obj.Month=interval;
    obj.ProductName=productName;
    obj.TotalView= Totalcount.length;
    obj.TotalUniqueView= (Totalcount
        .map(p => p.UserId)
        .filter((UserId, index, arr) => arr.indexOf(UserId) == index)).length;
    productList.push(obj);
   }
function GetWeeks(sDate,eDate)
   {
        var weeks = [];
        var startDate = moment(new Date(sDate)).isoWeekday(7);
        if(startDate.date() == 7) {
            startDate = startDate.isoWeekday(-6)
        }
        eDate= moment(eDate).add(7, 'days').toDate();
        while(startDate.isBefore(eDate)) {
            let startDateWeek = startDate.isoWeekday('Monday').format('YYYY/MM/DD');
            let endDateWeek = startDate.isoWeekday('Sunday').format('YYYY/MM/DD');
            startDate.add(7,'days');
            weeks.push([startDateWeek,endDateWeek]);
        }
        return weeks;
   }

  function GetDays(startDate, stopDate) 
  {
        var dateArray = [];
        var currentDate = moment(startDate);
        var stopDate = moment(stopDate);
        while (currentDate <= stopDate) {
            dateArray.push( moment(currentDate).format('YYYY-MM-DD') )
            currentDate = moment(currentDate).add(1, 'days');
        }
        return dateArray;
  }

   function GetMonths(sDate, eDate)
   {
        var dateStart = moment(sDate);
        var dateEnd = moment(eDate);
        var timeValues = [];
        while (dateEnd > dateStart || dateStart.format('M') === dateEnd.format('M')) {
            timeValues.push(dateStart.format('YYYY-MM'));
            dateStart.add(1,'month');
        }
        return timeValues;
   }
