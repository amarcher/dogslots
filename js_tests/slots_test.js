QUnit.module("RepoForm", {
  beforeEach: function(assert) {
    $('#qunit-fixture').append('<script id="bone-template" type="text/x-handlebars-template">\
  <img src="bone2.png" class="bone" id="bone_{{bone_id}}">\
    </script>');
    this.repoList = new RepoList("#repo-list");
    this.form = new RepoForm("#new-repo", this.repoList);
  }
});

QUnit.test( "Required elements are on the page", function( assert ) {
  assert.equal( this.repoList.$el.length, 1);
  assert.equal( this.form.$el.length, 1);
  assert.equal( this.form.$nameInput.length, 1);
});

QUnit.test( "#listen should add an event listener to the form", function( assert ) {
  this.mock(this.form).expects('submitForm').once().returns(false);
  this.form.listen();

  this.form.$el.trigger('submit');
});

QUnit.test( "#submitForm when successful should make an ajax request and call addRepo", function( assert ) {
  this.form.init();

  var response = $.Deferred();
  this.form.$nameInput.val('My great repo');
  this.mock($)
    .expects('post')
    .withExactArgs(this.form.$el.attr('action'), this.form.$el.serialize())
    .returns(response);
  this.mock(this.form).expects('addRepo').withArgs({name: 'My great repo', description: 'Automatically Added!'}).once();
  response.resolve({'name': 'My great repo', 'description': 'Automatically Added!'});

  this.form.submitForm({preventDefault: function(){}});
});


QUnit.test( "#submitForm when unsuccessful should make an ajax request and call handleFail", function( assert ) {
  this.form.init();

  var response = $.Deferred();
  this.form.$nameInput.val('My great repo');
  this.mock($)
    .expects('post')
    .withExactArgs(this.form.$el.attr('action'), this.form.$el.serialize())
    .returns(response);
  this.mock(this.form).expects('handleFail').withArgs({'status': 500}).once();
  response.reject({'status': 500});

  this.form.submitForm({preventDefault: function(){}});
});

QUnit.test( "#addRepo should call the view's addRepo method and clear the input", function( assert ) {
  this.form.init();

  this.form.$nameInput.val('My great repo');
  this.mock(this.form.view).expects('addRepo')
      .withArgs({'name': 'My great repo', 'description': 'Automatically Added!'});

  this.form.addRepo({'name': 'My great repo', 'description': 'Automatically Added!'});
  assert.equal(this.form.$nameInput.val(), '');
});

QUnit.test( "#handleFail should replace the the input with error text", function( assert ) {
  this.form.init();

  this.form.$nameInput.val('My great repo');
  this.form.handleFail();
  assert.equal(this.form.$nameInput.val(), 'Oops something went wrong!');
});

QUnit.test( "#handleFail should replace the the input with error text", function( assert ) {
  this.form.init();

  this.form.$nameInput.val('My great repo');
  this.form.handleFail();
  assert.equal(this.form.$nameInput.val(), 'Oops something went wrong!');
});

QUnit.module("RepoList", {
  beforeEach: function(assert) {
  $('#qunit-fixture').append('<div id="repo-list" class="box repo"> \
    <div class="row fill repo-template" style="display: none;"> \
    <a href=""> \
    <div class="left"> \
      <ul> \
        <li class="repo-name"></li> \
        <li class="repo-desc"></li> \
      </ul> \
    </div> \
    <div class="right repo-stars"> \
    </a> \
    </div> \
  </div>');
    this.$repoList = $('#repo-list');
    this.$template = $('.repo-template');
    this.repoList = new RepoList("#repo-list");
  }
});

QUnit.test( "#prepareTemplate should return a new jQuery repo object without the template class", function( assert ) {
  var template = this.repoList.prepareTemplate();
  assert.ok(template instanceof jQuery);
  assert.equal(template.hasClass('repo-template'), false);
});

QUnit.test( "#prepareTemplate should append and show a filled in template", function( assert ) {
  this.repoList.addRepo({'name': 'My great repo', 'description': 'Automatically Added!', 'owner': 'amarcher'});
  var expected = "<div class=\"row fill\" style=\"\">     <a href=\"user/amarcher/repo/My great repo\">     <div class=\"left\">       <ul>         <li class=\"repo-name\">My great repo</li>         <li class=\"repo-desc\">Automatically Added!</li>       </ul>     </div>     </a><div class=\"right repo-stars\"><a href=\"user/amarcher/repo/My great repo\">     </a>     </div>   </div>     <div class=\"row fill repo-template\" style=\"display: none;\">     <a href=\"\">     <div class=\"left\">       <ul>         <li class=\"repo-name\"></li>         <li class=\"repo-desc\"></li>       </ul>     </div>     </a><div class=\"right repo-stars\"><a href=\"\">     </a>     </div>   </div>"
  assert.equal($('#repo-list').html(), expected);
});


