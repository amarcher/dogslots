NumberOfImages = 13;
ImageWidth = 432;
StartBones = 5;
Rotations = 10;

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
							'Yellow',
							'Peking',
							'Bull',
							'Welsh',
							'Wild'];
LastNames = 	[null,
							'-shephard',
							'-terrier',
							'-kin',
							'-huahua',
							'-labrador',
							'-spaniel',
							'-dle',
							'-waterdog',
							'-lab',
							'-ese',
							'-dog',
							'-corgi',
							'-wolf'];

ion.sound({
  sounds: [
    {name: "dog bark"},
    {name: "register"},
    {name: "success"},
    {name: "coin in slot"},
    {name: "game start"}
  ],
  volume: 1,
  path: "sounds/",
  preload: true
});

function NameArea( node ) {
	this.names = node.children();
	this.activeEl = null;
}

NameArea.prototype = {
  display: function( newPos ) {
  	this.activeEl = $('[data-posone="' + newPos[0] + '"][data-postwo="' + newPos[1] + '"]');
  	this.activeEl.toggleClass('hide');
  },

  clearOut: function() {
  	if (this.activeEl) {
  		this.activeEl.toggleClass('hide');
  	}
  }
};

function Slot(els, winEl, boneEl, controlEl, nameEl ) {
	this.reels = els;
	this.positions = [0,0];
	this.winTallyArea = winEl;
	this.winCount = 0;
	this.bones = [];
	this.nextBoneId = 0;
	this.boneTally = 0;
	this.boneTallyArea = boneEl;
	this.control = controlEl;
	this.nameArea = new NameArea( nameEl );
	this.setUpGame();
	this.goLeft = true;
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
		var _this = this, bgX, bgY, rotation;
		
		// play sound
		this.playSound('coin in slot');

		// decrement boneTally
		this.removeBone();

		// disable button
		this.disableControls();

		// clear dog name
		this.clearDogName();

		// determine rotation
		rotation = -this.goLeft * Rotations * NumberOfImages * ImageWidth;
		this.goLeft = -this.goLeft;

		// spin reels
		$.each( this.reels, function( index, value ){
			bgX = rotation - ( ImageWidth * (finalPos[index] - 1) );
			bgY = -300*index;
			$(value).animate(
				{
					backgroundPosition: bgX + 'px ' + bgY + 'px'
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
		if (this.winner()) {
			this.win();
			this.enableControls();
		} else if (this.boneTally === 0) {
			this.gameOver();
		} else {
			this.enableControls();
		}
 	},

 	winner: function() {
 		if (this.positions[0] === 13 || this.positions[1] === 13) {
 			return true;
 		} else {
 			return this.positions[0] === this.positions[1];
 		}
 	},

 	win: function() {
 		this.winCount += 1;
 		this.winTallyArea.text( this.winCount );
 		
 		var payout = this.payout();
 		for (var i=0; i<payout; i++) {
 			this.addBone();
	 	}

	 	this.playSound('success');
 	},

 	finalPos: function() {
 		var newPostions = [];
 		for ( var i=0, len=this.reels.length; i < len; i++ ) {
 			newPostions.push( Math.floor( ( Math.random() * NumberOfImages ) ) + 1 );
    }
	  return newPostions;
  },

  payout: function() {
  	// double wolf is a mega win 
  	if (this.positions[0] === this.positions[1] === 13) {
  		return 25;
  	} else {
	  	return 5;
	  }
  },

  playSound: function(name) {
  	ion.sound.play(name);
  },

  setDogName: function() {
  	this.nameArea.display( this.positions );
  },

  clearDogName: function() {
  	this.nameArea.clearOut();
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
	  var html = modal_template({toys: this.winCount, plural: this.winCount === 1 ? "" : "s" });
	  $('body').append(html);
	  $('#start_over').on('click',function(){
	  	_this.restart();
	  	_this.playSound('game start');
	  	$('#overlay, #modal').remove();
	  });
	  $('#get_more_bones').on('click',function(){ 
	  	_this.addBones(StartBones);
	  	_this.enableControls();
	  	_this.playSound('register');
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

	var slot = new Slot( $('.slot'), $('.wins'), $('.bones'), $('#control'), $('.dogname') );
});