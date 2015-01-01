NumberOfImages = 9;
ImageWidth = 432;
StartBones = 1;

function Bone(boneId) {
	this.el = null;
	this.boneId = boneId;
	this.context = { bone_id: this.boneId };
	this.html    = bone_template(this.context);
	this.boneBank = $('.bone_drop'); // TODO: move after doc loads
}

Bone.prototype = {

	add: function() {
		this.boneBank.prepend( this.html );
		this.el = $('#bone_' + this.boneId);
		this.el.css({ 'top': '-70vh' }).animate({ 
      top: "+=100vh",
      rotateZ: "+=1080"
    }, 500 );
	},

	remove: function() {
		this.el.animate({ 
      top: "+=100vh",
    }, 500 ).hide(1000);
	}

};

FirstNames = 	[null,
							'Aussie',
							'Boston',
							'Boy',
							'Chi',
							'Chocolate',
							'Cocker',
							'Poo',
							'Portuguese',
							'Yellow'];
LastNames = 	[null,
							'-shephard',
							'-terrier',
							'-kin',
							'-huahua',
							'-labrador',
							'-spaniel',
							'-dle',
							'-waterdog',
							'-lab'];

ion.sound({
  sounds: [
    {
      name: "door_bell"
    }
  ],
  volume: 1,
  path: "sounds/",
  preload: true
});

function NameWheel(el) {
	this.carousel = el;
	this.panelCount = el.children().length;
	this.activeEl = $(el.children()[0]);
	this.pos = this.activeEl.index();
	this.theta = this.pos * ( 360 / this.panelCount );
	this.activeEl.addClass('result');
}

NameWheel.prototype = {

  spin: function( newPos ){
  	this.activeEl.toggleClass('result');
  	var destination = '[data-posone="' + newPos[0] + '"][data-postwo="' + newPos[1] + '"]';
  	var destEl = $(this.carousel.find(destination));
  	var destIndex = destEl.index();
    var increment = destIndex - this.pos;
    this.pos = destIndex;
    this.theta += ( 360 / this.panelCount ) * increment * -1;
    this.carousel.css(
    	{ transform: 'rotateX(' + this.theta + 'deg)' }
  	);
  	this.activeEl = destEl;
  	this.activeEl.toggleClass('result');
  }
};

function Slot(els, winEl, boneEl, controlEl, nameEls, nameWheelEl) {
	this.reels = els;
	this.positions = [0,0];
	this.nameWheel = new NameWheel( $(nameWheelEl) );
	this.winTallyArea = winEl;
	this.winCount = 0;
	this.bones = [];
	this.nextBoneId = 0;
	this.boneTally = 0;
	this.boneTallyArea = boneEl;
	this.control = controlEl;
	this.firstName = $(nameEls[0]);
	this.lastName = $(nameEls[1]);
	this.setUpGame();
}

Slot.prototype = {

	setUpGame: function() {
		var _this = this;
		// add start bones
		this.addBones(StartBones);
		// set up click controller
		this.control.click( function() {
		  _this.start(_this.finalPos());
		});
		this.clearDogName();
	},

	start: function(finalPos) {
		var _this = this;
		
		// decrement boneTally
		this.removeBone();

		// disable button
		this.disableControls();

		// clear dog name
		this.clearDogName();

		// spin nameWheel
		this.nameWheel.spin(finalPos);

		// spin reels
		$.each( this.reels, function( index, value ){
			$(value).animate(
				{
					backgroundPosition: -10*finalPos[index]*ImageWidth + 'px ' + -300*index + 'px'
				},
				3200,
				"easeOutQuint",
				function() {
					if ( index == _this.reels.length - 1 ) // last reel stopped spinning
						_this.stop(finalPos);
				}
			);
		});
	},

	stop: function(finalPos) {

		if (finalPos) {
			this.positions = finalPos;
			this.setDogName();
		} else {
			// find final position
		}
		if (this.positions[0] === this.positions[1]) {
			this.winner();
			this.enableControls();
		} else if (this.boneTally === 0) {
			this.gameOver();
		} else {
			this.enableControls();
		}
 	},

 	winner: function() {
 		this.winCount += 1;
 		this.winTallyArea.text( this.winCount );
 		
 		var payout = this.payout();
 		for (var i=0; i<payout; i++) {
 			this.addBone();
	 	}

		ion.sound.play("door_bell");
		setTimeout(function() {
			ion.sound.play("door_bell");
		}, 500);
 	},

 	finalPos: function() {
 		var newPostions = [];
 		for ( var i=0, len=this.reels.length; i < len; i++ ) {
 			newPostions.push( Math.floor( ( Math.random() * NumberOfImages ) + 1 ) );
	    }
	  return newPostions;
  },

  payout: function() {
  	return 1;
  },

  setDogName: function() {
  	console.log( this.positions );
  	var first = FirstNames[ this.positions[0] ];
  	var last = LastNames[ this.positions[1] ];
  	this.firstName.text( first );
  	this.lastName.text( last );
  },

  clearDogName: function() {
  	this.firstName.text('');
  	this.lastName.text('');
  },

  restart: function() {
  	// remove all bones
  	console.log('restarting');

  	for ( var i=0; i<this.bones.length; i++ ) {
  		this.removeBone();
  	}

  	this.addBones(StartBones);
  	this.winCount = 0;
  	this.winTallyArea.text(this.winCount);
  	this.enableControls();
  },

  gameOver: function() {
  	var _this = this;
	  var html = modal_template({toys: this.winCount});
	  $('body').append(html);
	  $('#start_over').on('click',function(){
	  	_this.restart();
	  	$('#overlay, #modal').remove();
	  });
	  $('#get_more_bones').on('click',function(){ 
	  	_this.addBones(StartBones);
	  	_this.enableControls();
	  	$('#overlay, #modal').remove();
	  });
  },

  disableControls: function() {
  	this.control.prop("disabled", true);
  },

  enableControls: function() {
  	this.control.prop("disabled", false);
  },

  addBone: function() {
  	var bone = new Bone( this.nextBoneId );
		this.bones.unshift( bone );
 		this.boneTally++;
  	this.nextBoneId++;
  	bone.add();
 		this.boneTallyArea.text( this.boneTally );
  },

  addBones: function(bones) {
  	for ( var i=0; i<bones; i++ ) {
  		this.addBone();
  	}
  },

  removeBone: function() {
  	var bone = this.bones.pop();
  	bone.remove();
  	this.boneTally--;
  	this.boneTallyArea.text( this.boneTally );
  }
};

$(document).ready(function() {
	// precompile templates
	var bone_source   = $("#bone-template").html();
	var modal_source   = $("#modal-template").html();

	// global variable
	bone_template = Handlebars.compile(bone_source);
	modal_template = Handlebars.compile(modal_source);

	var slot = new Slot( $('.slot'), $('.wins'), $('.bones'), $('#control'), $('.dogname span'), $('.carousel') );
});