// from https://twitter.com/koreapyj/status/950706028160565248 
// src https://github.com/koreapyj/elevatorsaga-dumb / elevator.js 
( { 
	  waitUntilFull : false 
	, stopWhenAvailable : false 
	, init : function( elevators, floors ) { 
		waitUntilFull = this .waitUntilFull; 
		console .log( elevators ); 
		// i ..? 
		for( i = 0; i < elevators .length; i++ ) { 
			elevators[ i ] .index = i; 
			} 
		_ .each( elevators, elevator => { 
			Object .assign( elevator, { floorsToUp : [], floorsToDown : [], floorsToStop : [] } ); 
			
			elevator .move = q => { 
				var [ minFloor, maxFloor ] = [ floors .length + 1, -1 ]; 
				for ( i = floors .length; i--; ) { 
					if ( [ 'floorsToStop', 'floorsToUp', 'floorsToDown' ] .some( f => elevator[ f ][ i ] ) ) { 
						maxFloor = maxFloor < i ? i : maxFloor; 
						minFloor = minFloor > i ? i : minFloor; 
						} 
					} 
				
				if ( 
						waitUntilFull 
						&& [ 'currentFloor', 'loadFactor' ] 
							.map( f => elevator[ f ]() ) .reduce( ( c, f ) => ( c == 0 && f < 0 ) || ( c != 0 && f == 0 ) ) 
						) { 
					Object .assign( elevator, { 
						  status : 'waiting' 
						, timer : ( clearTimeout( elevator .timer ), setTimeout( q => elevator .move(), 1000 ) ) 
						} ); 
					return; 
					} 
				
				elevator .status = null; 
				var stopFloor = -1; 
				[ [ 'goingUpIndicator', 'maxinum', maxFloor ], [ 'goingDownIndicator', 'minimum', minFloor ] ] 
				.some( ( [ g, t, f ] ) => { 
					if ( ! elevator[ g ]() ) 
						{ return; } 
					elevator .destinationQueue .pop(); 
					console .log( `EV${ elevator .index }: Go to ${ f } (${ t })` ); 
					elevator .destinationQueue .push( f ); 
					return true; 
					} ) 
				// else 
				|| console .log( elevator ) 
					; 
				elevator .checkDestinationQueue(); 
				}; // -- .move 
			
			elevator .on( "floor_button_pressed", floorNum => { 
				elevator .floorsToStop[ floorNum ] = true; 
				elevator .move(); 
				} ); // -- .on( 'floor_button_pressed' ) 
			
			var 
				goElevator = ( elevator, ingUpIndicator, ingDownIndicator, ToFloor ) => {
					[ [ 'goingUpIndicator', ingUpIndicator ], [ 'goingDownIndicator', ingDownIndicator ] ] .forEach( 
						( [ f, q ] ) => elevator[ f ][ i ] ? q[ 0 ] .push( i ) : 0 
						); 
					if ( ToFloor !== undefined ) { 
						elevator .goToFloor( ToFloor ); 
						} 
					} // -- goElevator 
				; 
			
			elevator .on( "idle", q => { 
				console .log( `Elevator idle (${ elevator .maxPassengerCount() })` ); 
				goElevator( elevator, false, false ); 
				
				var upQueue = [ [], [] ], downQueue = [ [], [] ], [ minFloor, maxFloor ] = [ floors .length + 1, -1 ]; 
				[ 
					  [ F => { for ( i = elevator .currentFloor(); i--; ) { F( i ); } } 
						, 0, i => minFloor > i ? minFloor = i : 0 
						] 
					, [ F => { for ( i = elevator .currentFloor(); i < floors .length; i++ ) { F( i ); } } 
						, 1, i => maxFloor < i ? maxFloor = i : 0 
						] 
					] 
				.forEach( ( [ L, p, r ] ) => L( i => { 
					[ [ 'floorsToDown', downQueue ], [ 'floorsToUp', upQueue ] ] 
					.forEach( ( [ f, q ] ) => elevator[ f ][ i ] ? q[ p ] .push( i ) : 0 ) 
						; 
					[ 'floorsToDown', 'floorsToUp' ] .some( f => elevator[ f ][ i ] ) 
					&& r( i ) 
						; 
					} ) ); // -- [ [ F => {} ] ] .forEach() 
				
				// weight if to down needs 
				var 
					toDown = [ upQueue, downQueue ] 
						.map( a => [ a[ 0 ] .length, a[ 1 ] .length ] ) .reduce( ( [ [ a0, a1 ], [ b0, b1 ] ] ) => a0 + b0 > a1 + b1 ) 
					; 
				goElevator( elevator, toDown, ! toDown, toDown ? minFloor : maxFloor  ); 
				} ); // -- .on( 'idle' ) 
			
			elevator .on( "stopped_at_floor", q => { 
				var 
					  floorNum = elevator .currentFloor() 
					, needToMoveMore = false 
					; 
				[ [ 0, true, false ], [ floors .length - 1, false, true ] ] 
				.some( ( [ v, u, d ] ) => ( floorNum == v ) && ( goElevator( elevator, u, d ), true ) ) 
				// else 
				|| [ 
					  [ 'goingUpIndicator', false, true, F => { for( i = elevator .currentFloor(); ++i < floors .length; ) { F( i ); } } ] 
					, [ 'goingDownIndicator', true, false, F => { for( i = elevator .currentFloor(); i--; ) { F( i ); } } ] 
					] 
				.some( ( [ g, u, d, F ] ) => { 
					if ( ! elevator[ g ]() ) 
						{ return; } 
					F( i => [ 'floorsToUp', 'floorsToDown', 'floorsToStop' ] .some( f => elevator[ f ][ i ] ) && ( needToMoveMore = true ) ); 
					needToMoveMore || goElevator( elevator, u, d ); 
					return true; 
					} )
					; 
				[ [ 'goingUpIndicator', 'floorsToUp' ], [ 'goingDownIndicator', 'floorsToDown' ] ] 
				.some( ( [ g, f ] ) => elevator[ g ]() && ( ( elevator[ f ][ floorNum ] = false ), true ) ) 
					; 
				elevator .floorsToStop[ floorNum ] = false; 
				} ); // -- .on( 'stopped_at_floor' ) 
			
			elevator .on( "passing_floor", ( floorNum, direction ) => { 
				[ [ 'up', 'floorsToUp' ], [ 'down', 'floorsToDown' ] ] 
				.some( ( [ d, f ] ) => { 
					if ( ! ( ( direction === d ) && elevator[ f ][ floorNum ]  ) ) 
						{ return; } 
					
					if ( elevator .loadFactor() < 0.5 ) { 
						console .log( `EV${ elevator .index }: Stop at ${ floorNum } (waiting passenger)` ); 
						elevator .destinationQueue .unshift( floorNum ); 
						} 
					else { 
						findBestElevator( floorNum, d ); 
						elevator[ f ][ floorNum ] = false; 
						} 
					return true; 
					} ) // -- [ [ 'up' ] ] .some() 
				// else.. 
				|| [ 'floorsToStop' ] 
				.some( f => { 
					if ( ! elevator[ f ][ floorNum ] ) 
						{ return; } 
					console .log( `EV${ elevator .index }: Stop at ${ floorNum } (button pressed)` ); 
					elevator .destinationQueue .unshift( floorNum ); 
					return true; 
					} ) // -- [ 'floorsToStop' ] .some() 
					; 
				elevator .checkDestinationQueue(); 
				} ); // -- .on( 'passing_floor' ) 
			} ); // -- _ .each( elevators ) 
		
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
				sameDirection = 0; // for or operator 
				[ [ 'up', 'goingUpIndicator' ], [ 'down', 'goingDownIndicator' ] ] 
				.some( ( [ d, f ] ) => sameDirection = sameDirection || direction == d && elevator[ f ]() ) 
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
				distance = [ 
						  elevator .destinationQueue .slice( -1 )[ 0 ] - elevator .currentFloor() 
						, floor .level + ( ( ! sameDirection ) ? - elevator .destinationQueue .slice( -1 )[ 0 ] : floors .length ) 
						] 
					.map( Math .abs ) .reduce( ( a, b ) => a + b ) 
					; 
				( distance < bestDistance ) && ( [ bestElevatorByDistance, bestDistance ] = [ i, distance ] ); 
				} 
			[ [ bestElevator, 'on the road' ], [ bestElevatorByDistance, 'best selection by distance' ] ] 
			.some( ( [ v, t ] ) => { 
				if ( ! ( v != -1 ) ) 
					{ return; } 
				
				elevators[ v ] 
					[ direction === 'up' ? 'floorsToUp' : 'floorsToDown' ] 
					[ floor .level ] = true 
					; 
				elevators[ v ] .move(); 
				// elevator from where..? 
				console .log( `EV${ elevator .index }: will go to floor ${ floor .level } (${ t }/${ direction })` ); 
				return true; 
				} ); 
			}; // -- findBestElevator 
		
		_ .each( floors, floor => { 
			[ [ 'up_button_pressed', 'up' ], [ 'down_button_pressed', 'down' ] ] 
			.forEach( ( [ f, e ] ) => { 
				floor .on( f, floor => findBestElevator( floor, e ) ); 
				} ); 
			} ); // -- _ .each( floors ) 
		} // -- .init 
	, update : ( dt, elevators, floors ) => { 
		// We normally don't need to do anything here 
		} // -- .update 
	} ) 
