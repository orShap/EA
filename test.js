var myFunctions = require('./index');

// A fake request object, with req.query.text set to 'input'
const req = { "body": {"date" : "2018-02-16" }};
// A fake response object, with a stubbed redirect function which asserts that it is called
// with parameters 303, 'new_ref'.
const res = {
  redirect: (code, url) => {
  }
};

// Invoke addMessage with our fake request and response objects. This will cause the
// assertions in the response object to be evaluated.
myFunctions.getSymbolsByDate(req, res);