
export('ListenerAdaptor');

/**
 * A utility class to ease work with event based java classes. This includes:
 *
 * <ul>
 * <li>A wrapper registry for automatically wrapping java objects in callbacks</li>
 * <li>An addListener method that automatically generates a java adapter for a given
 *     class or interface from a javascript function</li>
 * <li>A try-catch wrapper around callbacks to display error info</li>
 * </ul>
 */
function ListenerAdaptor() {
    var converters = [];

    this.addArgumentConverter = function(javaClass, converter) {
        converters.push({javaClass: javaClass, converter: converter});
    };

    this.wrappedListener = function( classOrInterface, listener ) {

        function invokeWrapped(callback) {
            return function() {
                try {
                    for (var i = 0; i < arguments.length; i++) {
                        for each (var mapping in converters) {
                            if (arguments[i] instanceof mapping.javaClass) {
                                arguments[i] = mapping.converter(arguments[i]);
                            }
                        }
                    }
                    return callback.apply(this, arguments);
                } catch (error) {
                    print(error);
                    if (error.stack) print(error.stack);
                }
            }
        }

        if (typeof listener == 'function') {
			listener = invokeWrapped(listener);
        } else {
			for (var i in listener)
				listener[i] = invokeWrapped(listener[ i ]);
        }

        return new JavaAdapter(classOrInterface, listener);
    };

}

