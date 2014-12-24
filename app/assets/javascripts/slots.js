$(document).ready(function() {
	NumberOfImages = 10;
	ImageWidth = 432;

	function Slot(els) {
		this.reels = els;
		this.positions = [0,0];
	}

	Slot.prototype = {

		start: function(finalPos) {
			$.each( this.reels, function( index, value ){
				$(value).animate(
					{
						backgroundPositionX: 3*finalPos[index]*ImageWidth + 'px'
					},
					3800,
					"easeOutQuint"
				);
			});
		},

		stop: function() {

	 	},

	 	finalPos: function() {
	 		var newPostions = [];
	 		for ( var i=0, len=this.reels.length; i < len; i++ ) {
	 			newPostions.push( Math.floor( (Math.random() * NumberOfImages) + 1 ) );
 	    }
 	    return newPostions;
 	  }
	};

	var slot = new Slot( $('.slot') );

	/**
	* Slot machine controller
	*/
	$('#control').click(function() {
	  slot.start(slot.finalPos());
	});
});