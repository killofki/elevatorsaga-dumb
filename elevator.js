// from https://twitter.com/koreapyj/status/950706028160565248 
// src https://github.com/koreapyj/elevatorsaga-dumb / elevator.js 
( { 
	  waitUntilFull : false 
	, stopWhenAvailable : false 
	, init : function( elevators, floors ) { 
		waitUntilFull = this .waitUntilFull; 
		console .log( elevators ); 
		for( i = 0; i < elevators .length; i++ ) { 
			elevators[ i ] .index = i; 
			} 
		_ .each( elevators, elevator => { 
			Object .assign( elevator, { 
				  floorsToUp : [] 
				, floorsToDown : [] 
				, floorsToStop : [] 
				} ); 
			
			elevator .move = q => { 
				var 
					  minFloor = floors .length + 1 
					, maxFloor = -1 
					; 
				for ( i = floors .length; i--; ) { 
					if ( [ 'Stop', 'Up', 'Down' ] .some( v => elevator[ `floorsTo${ v }` ][ i ] ) ) { 
						maxFloor = maxFloor < i ? i : maxFloor; 
						minFloor = minFloor > i ? i : minFloor; 
						} 
					} 
				
				if( waitUntilFull ) { 
					if ( 
							   ( elevator .currentFloor() == 0 && elevator .loadFactor() < 0.7 ) 
							|| ( elevator .currentFloor() != 0 && elevator .loadFactor() == 0 ) 
							) { 
						elevator .status = 'waiting'; 
						clearTimeout( elevator .timer ); 
						elevator .timer = setTimeout( q => elevator .move(), 1000 ); 
						return; 
						} 
					else { 
						elevator .status = null; 
						} 
					} 
				else { 
					elevator .status = null; 
					} 
				var stopFloor = -1; 
				if ( elevator .goingUpIndicator() ) { 
					elevator .destinationQueue .pop(); 
					console .log( `EV${ elevator .index }: Go to ${ maxFloor } (maximum)` ); 
					elevator .destinationQueue .push( maxFloor ); 
					} 
				else if( elevator .goingDownIndicator() ) { 
					elevator .destinationQueue .pop(); 
					console .log( `EV${ elevator .index }: Go to ${ minFloor } (minimum)` ); 
					elevator .destinationQueue .push( minFloor ); 
					} 
				else { 
					console .log( elevator ); 
					} 
				elevator .checkDestinationQueue(); 
				}; 
			
			elevator .on( "floor_button_pressed", floorNum => { 
				elevator .floorsToStop[ floorNum ] = true; 
				elevator .move(); 
				} ); 
			
			elevator .on( "idle", q => { 
				console .log( `Elevator idle (${ elevator .maxPassengerCount() })` ); 
				elevator .goingUpIndicator( false ); 
				elevator .goingDownIndicator( false ); 
				
				var 
					  upQueue = [ [], [] ] 
					, downQueue = [ [], [] ] 
					, minFloor = floors .length + 1 
					, maxFloor = -1 
					; 
				for ( i = elevator .currentFloor(); i--; ) { 
					if ( elevator .floorsToDown[ i ] ) {
						downQueue[ 0 ] .push( i ); 
						} 
					if ( elevator .floorsToUp[ i ] ) { 
						upQueue[ 0 ] .push( i ); 
						} 
					if ( 
								[ 'Down', 'Up' ] .some( v => elevator[ `floorsTo${ v }` ][ i ] ) 
							&& minFloor > i 
							) { 
						minFloor = i; 
						} 
					} 
				for ( i = elevator .currentFloor(); i < floors .length; i++ ) { 
					if ( elevator .floorsToDown[ i ] ) {
						downQueue[ 1 ] .push( i ); 
						} 
					if ( elevator .floorsToUp[ i ] ) {
						upQueue[ 1 ] .push( i ); 
						} 
					if ( 
								[ 'Down', 'Up' ] .some( v => elevator[ `floorsTo${ v }` ][ i ] ) 
							&& maxFloor < i 
							) { 
						maxFloor = i;
						} 
					} 
				
				if ( ( upQueue[ 0 ] .length + downQueue[ 0 ] .length ) > ( upQueue[ 1 ] .length + downQueue[ 1 ] .length ) ) { 
					elevator .goingUpIndicator( false ); 
					elevator .goingDownIndicator( true ); 
					elevator .goToFloor( minFloor ); 
					} 
				else { 
					elevator .goingUpIndicator( true ); 
					elevator .goingDownIndicator( false ); 
					elevator .goToFloor( maxFloor ); 
					} 
				} ); 
			
			elevator .on( "stopped_at_floor", q => { 
				var 
					  floorNum = elevator .currentFloor() 
					, needToMoveMore = false 
					; 
				if ( floorNum == 0 ) { 
					elevator .goingUpIndicator( true ); 
					elevator .goingDownIndicator( false ); 
					} 
				else if( floorNum == floors .length - 1 ) { 
					elevator .goingUpIndicator( false ); 
					elevator .goingDownIndicator( true ); 
					} 
				else { 
					if( elevator .goingUpIndicator() ) { 
						for( i = elevator .currentFloor(); ++i < floors .length; ) { 
							if( [ 'Up', 'Down', 'Stop' ] .some( v => elevator[ `floorsTo${ v }` ][ i ] ) ) { 
								needToMoveMore = true; 
								} 
							} 
						if( ! needToMoveMore ) { 
							elevator .goingUpIndicator( false ); 
							elevator .goingDownIndicator( true ); 
							} 
						} 
					else if( elevator .goingDownIndicator() ) { 
						for( i = elevator .currentFloor(); i--; ) { 
							if ( [ 'Up', 'Down', 'Stop' ] .some( v => elevator[ `floorsTo${ v }` ][ i ] ) ) { 
								needToMoveMore = true; 
								} 
							} 
						if( ! needToMoveMore ) { 
							elevator .goingUpIndicator( true ); 
							elevator .goingDownIndicator( false ); 
							} 
						} 
					} 
				if ( elevator .goingUpIndicator() ) { 
					elevator .floorsToUp[ floorNum ] = false; 
					} 
				else if( elevator .goingDownIndicator() ) { 
					elevator .floorsToDown[ floorNum ] = false; 
					} 
				elevator .floorsToStop[ floorNum ] = false; 
				} ); 
			
			elevator .on( "passing_floor", ( floorNum, direction ) => { 
				if ( 
							direction == 'up' 
						&& elevator .floorsToUp[ floorNum ] 
						) { 
					if ( elevator .loadFactor() < 0.5 ) { 
						console .log( `EV${ elevator .index }: Stop at ${ floorNum } (waiting passenger)` ); 
						elevator .destinationQueue .unshift( floorNum ); 
						} 
					else { 
						findBestElevator( floorNum, 'up' ); 
						elevator .floorsToUp[ floorNum ] = false; 
						} 
					} 
				else if( 
							direction == 'down' 
						&& elevator .floorsToDown[ floorNum ] 
						) { 
					if ( elevator .loadFactor() < 0.5 ) { 
						console .log( `EV${ elevator .index }: Stop at ${ floorNum } (waiting passenger)` ); 
						elevator .destinationQueue .unshift( floorNum ); 
						} 
					else { 
						findBestElevator( floorNum, 'down' ); 
						elevator .floorsToDown[ floorNum ] = false; 
						} 
					} 
				else if( elevator .floorsToStop[ floorNum ] ) { 
					console .log( `EV${ elevator .index }: Stop at ${ floorNum } (button pressed)` ); 
					elevator .destinationQueue .unshift( floorNum ); 
					} 
				elevator .checkDestinationQueue(); 
				} ); 
			} ); 
		
		var findBestElevator = ( floor, direction ) => { 
			var 
				  bestElevator = -1 
				, bestElevatorByDistance = -1 
				, bestElevatorByCapacity = -1 
				, bestCapacity = -1 
				, bestDistance = floors .length * 3 
				; 
			for ( i = elevators .length; i--; ) { 
				elevator = elevators[ i ]; 
				sameDirection = 
					   ( direction == 'up' && elevator .goingUpIndicator() ) 
					|| ( direction == 'down' && elevator .goingDownIndicator() )
					; 
				neededDirection = ( elevator .currentFloor() < floor .level ? 'up' : 'down' ) == direction; 
				if ( 
						   neededDirection 
						&& sameDirection 
						&& bestCapacity < elevator .maxPassengerCount() 
						) { 
					if ( elevator .floorsToStop .slice( elevator .currentFloor(), floor .level ) .indexOf( true ) != -1 ) { 
						bestElevator = i; 
						bestCapacity = elevator .maxPassengerCount(); 
						} 
					} 
				if( ! sameDirection ) { 
					distance = 
						  Math .abs( elevator .currentFloor() - elevator .destinationQueue .slice( -1 )[ 0 ] ) 
						+ Math .abs( floor .level - elevator .destinationQueue .slice( -1 )[ 0 ] ) 
						; 
					if ( distance < bestDistance ) { 
						bestElevatorByDistance = i; 
						bestDistance = distance; 
						} 
					} 
				else { 
					distance = 
						  Math .abs( elevator .destinationQueue .slice( -1 )[ 0 ] - elevator .currentFloor() ) 
						+ floors .length 
						+ floor .level 
						;
					if ( distance < bestDistance ) { 
						bestElevatorByDistance = i; 
						bestDistance = distance; 
						} 
					} 
				} 
			if ( bestElevator != -1 ) { 
				if ( direction == 'up' ) {
					elevators[ bestElevator ] .floorsToUp[ floor .level ] = true; 
					} 
				else {
					elevators[ bestElevator ] .floorsToDown[ floor .level ] = true; 
					} 
				elevators[ bestElevator ] .move(); 
				console .log( `EV${ elevator .index }: will go to floor ${ floor .level } (on the road/${ direction })` ); 
				return; 
				} 
			else if ( bestElevatorByDistance != -1 ) { 
				if ( direction == 'up' ) {
					elevators[ bestElevatorByDistance ] .floorsToUp[ floor .level ] = true; 
					} 
				else {
					elevators[ bestElevatorByDistance ] .floorsToDown[ floor .level ] = true; 
					}
				elevators[ bestElevatorByDistance ] .move(); 
				console .log( `EV${ elevator .index }: will go to floor ${ floor .level } (best selection by distance/${ direction })` ); 
				} 
			}; 
		
		_ .each( floors, floor => { 
			floor .on( "up_button_pressed", floor => findBestElevator( floor, 'up' ) ); 
			floor .on( "down_button_pressed", floor => findBestElevator( floor, 'down' ) ); 
			} ); 
		}
	, update : ( dt, elevators, floors ) => {
		// We normally don't need to do anything here
		}
	} ) 
