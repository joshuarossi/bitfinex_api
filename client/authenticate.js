var cb = function(error, result){
  if (error){
    console.log(error);
  }
  else {
    Session.set('authenticated', true);
    Router.go('dashboard');
  }
};

Template.authenticate.events({
  "submit form": function (event) {
    event.preventDefault();
    // This function is called when the new task form is submitted
    var key = event.target.api_key.value;
    var secret = event.target.api_secret.value;
    Meteor.call('bfx_auth', key, secret, cb);
    // Clear form
    event.target.api_key.value = "";
    event.target.api_secret.value = "";
  }
});
//Template.registerHelper('mySession', function(input){
//  return Session.get(input);
//});
Template.authenticate.helpers({
  authenticated: function () {
    return Session.get("authenticated");
  }
});