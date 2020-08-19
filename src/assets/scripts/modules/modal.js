;(function ( w, doc, undefined ) {
	'use strict';

	/**
	 * Local object for method references,
	 * define script metadata, and other
	 * global variables.
	 */
	var ARIAmodal = {};
	w.ARIAmodal   = ARIAmodal;

	ARIAmodal.NS      = 'ARIAmodal';
	ARIAmodal.AUTHOR  = 'Scott O\'Hara';
	ARIAmodal.VERSION = '3.4.0';
	ARIAmodal.LICENSE = 'https://github.com/scottaohara/accessible_modal_window/blob/master/LICENSE';

	var activeClass = 'modal-open';
	var body = doc.body;
	var main = doc.getElementsByTagName('main')[0] || body;

	var modal = doc.querySelectorAll('[data-modal]');
	var children = doc.querySelectorAll('body > *:not([data-modal])');

	var initialTrigger;
	var activeModal;
	var useAriaModal = false;
	var returnToBody = false;

	var firstClass = 'js-first-focus';
	var lastClass = 'js-last-focus';

	var tabFocusElements = 'button:not([hidden]):not([disabled]), [href]:not([hidden]), input:not([hidden]):not([type="hidden"]):not([disabled]), select:not([hidden]):not([disabled]), textarea:not([hidden]):not([disabled]), [tabindex="0"]:not([hidden]):not([disabled]), summary:not([hidden]), [contenteditable]:not([hidden]), audio[controls]:not([hidden]), video[controls]:not([hidden])';


	/**
	 * Function to place the modal dialog(s) as the first child(ren)
	 * of the body element, so tabbing backwards will move focus
	 * into the browser's chrome.
	 */
	ARIAmodal.organizeDOM = function () {
		var refEl = body.firstElementChild || null;
		var i;

		for ( i = 0; i < modal.length; i++ ) {
			body.insertBefore( modal[i], refEl );
		}
	};


	/**
	 * Global Create
	 *
	 * This function validates that the minimum required markup
	 * is present to create the ARIA widget(s).
	 *
	 * Any additional markup elements or attributes that
	 * do not exist in the found required markup patterns
	 * will be generated setup functions.
	 */
	ARIAmodal.setupTrigger = function () {
		var trigger = doc.querySelectorAll('[data-modal-open]');
		var self;
		var i;

		for ( i = 0; i < trigger.length; i++ ) {
			self = trigger[i];
			var getOpenTarget = self.getAttribute('data-modal-open');
			var hasHref = self.getAttribute('href');

			/**
			 * If not a button, update the semantics to make the element
			 * announce as a button and provide it a tabindex=0 to
			 * ensure it is keyboard focusable.
			 */
			if ( self.nodeName !== 'BUTTON' ) {
				self.setAttribute('role', 'button');
				self.tabIndex = 0;
			}

			/**
			 * If getOpenTarget was the empty string, but there is an
			 * href attribute, then get the possible target from the href
			 */
			if ( getOpenTarget === '' && hasHref ) {
				self.setAttribute('data-modal-open', hasHref.split('#')[1] );
				getOpenTarget = hasHref.split('#')[1];
			}

			/**
			 * If an <a href> was changed to a role=button, then the context
			 * menu of the 'button' should no longer act as if it's for a link.
			 * Removing the href attribute will negate the link context menu
			 * if a user performs a right-click.
			 */
			self.removeAttribute('href');

			/**
			 * Check for if a data-modal-open attribute is on
			 * a button. If not, then the button targets nothing
			 * and there's not much that can be done with that.
			 */
			if ( getOpenTarget ) {
				/**
				 * A button should have an aria-haspopup="dialog" to convey to users that
				 * *this* button will launch a modal dialog.
				 *
				 * Presently, the "dialog" value is not fully supported and in unsupported
				 * instances, it defaults back to announcing that a "menu" will open.
				 * Use this attribute with caution until this value has wider support.
				 */
				// self.setAttribute('aria-haspopup', 'dialog');

				/**
				 * Remove the disabled attribute, as if this script is running, JavaScript
				 * must be enabled and thus the button should function.
				 *
				 * But wait...there may be value in having a disabled button that can be
				 * enabled via other user actions. So, in that scenario look for a
				 * data-modal-disabled attribute, to keep the button disabled.
				 */
				if ( self.hasAttribute('disabled') && !self.hasAttribute('data-modal-disabled') ) {
					self.removeAttribute('disabled');
				}

				/**
				 * In instances when JavaScript is unavailable and a disabled
				 * button is not desired, a hidden attribute can be used to
				 * completely hide the button.
				 *
				 * Remove this hidden attribute to reveal the button.
				 */
				self.removeAttribute('hidden');

				/**
				 * Get modal target and supply the button with a unique ID to easily
				 * reference for returning focus to, once the modal dialog is closed.
				 */
				self.id = getOpenTarget + '__trigger-' + self.nodeName + '-' + i;

				/**
				 * Events
				 */
				self.addEventListener('click', ARIAmodal.openModal);
				self.addEventListener('keydown', ARIAmodal.keyEvents, false);
			}
			else {
				console.warn('Missing target modal dialog - [data-modal-open="IDREF"]');
			}
		} // for(widget.length)
	}; // ARIAmodal.setupTrigger()


	/**
	 * Setup the necessary attributes and child elements for the
	 * modal dialogs.
	 */
	ARIAmodal.setupModal = function () {
		var self;
		var i;

		for ( i = 0; i < modal.length; i++ ) {
			var self = modal[i];
			var modalType   = self.getAttribute('data-modal');
			var getClass    = self.getAttribute('data-modal-class') || 'a11y-modal';
			var heading     = self.querySelector('h1, h2, h3, h4, h5, h6');
			var modalLabel  = self.getAttribute('data-modal-label');
			var hideHeading = self.hasAttribute('data-modal-hide-heading');
			var modalDesc   = self.querySelector('[data-modal-description]');
			var modalDoc    = self.querySelector('[data-modal-document]');

			/**
			 * Check to see if this is meant to be an alert or normal dialog.
			 * Supply the appropriate role.
			 */
			if ( modalType === 'alert' ) {
				self.setAttribute('role', 'alertdialog');
			}
			else {
				self.setAttribute('role', 'dialog');
			}

			/**
			 * Set either the default dialog class or a class passed
			 * in from the data-modal-class attribute.
			 */
			self.classList.add(getClass);

			/**
			 * Modal dialogs need to be hidden by default.
			 *
			 * To ensure they stay hidden, even if CSS is disabled, or purposefully
			 * turned off, apply a [hidden] attribute to the dialogs.
			 */
			self.hidden = true;

			/**
			 * When a modal dialog is opened, the dialog itself
			 * should be focused. Set a tabindex="-1" to allow this
			 * while keeping the container out of the focus order.
			 */
			self.tabIndex = '-1';


			/**
			 * Older versions of NVDA used to automatically turn on forms mode
			 * when a user entered a modal dialog. A role="document", surrounding
			 * the content of the dialog would allow non-form dialogs to be
			 * navigated correctly by the virtual cursor.
			 *
			 * If a dialog needs to be compatible with older NVDA, look for
			 * a data-modal-document, and give that a role=document.
			 */
			if ( modalDoc ) {
				modalDoc.setAttribute('role', 'document');
			}


			/**
			 * Modal dialogs need at least one actionable item
			 * to close them...
			 */
			ARIAmodal.setupModalCloseBtn(self, getClass, modalType);

			/**
			 * The aria-modal attribute currently makes it difficult to navigate
			 * through the contents of a modal dialog with VoiceOver.
			 *
			 * Up/down arrows do not have access to all content, and
			 * using VO + left/right also do not have access to all
			 * content, but do have access to different content then
			 * up/down arrows alone.
			 *
			 * Note: The VoiceOver issues should be fixed with the release
			 * of Safari 12.
			 *
			 * Additionally, NVDA will mostly respect the aria-modal attribute
			 * with one notable bug, where if a user navigates to the address
			 * bar via NVDA key + F6, a user can re-enter document that is obscured
			 * by the open dialog, and can navigate the content 'beneath' the
			 * dialog with arrow keys, or quick keys.
			 *
			 * Using the tab key inconsistently returns a user to the modal
			 * dialog's contents, or may produce no keyboard focus change.
			 *
			 * This attribute can be added to a particular dialog if the
			 * dialog has a data-aria-modal attribute set.
			 */
			if ( self.hasAttribute('data-aria-modal') ) {
				self.setAttribute('aria-modal', 'true');
			}


			/**
			 * Do a check to see if there is an element flagged to be the
			 * description of the modal dialog.
			 */
			if ( modalDesc ) {
				modalDesc.id = modalDesc.id || 'md_desc_' + Math.floor(Math.random() * 999) + 1;
				self.setAttribute('aria-describedby', modalDesc.id);
			}

			/**
			 * Check for a heading to set the accessible name of the dialog,
			 * or if an aria-label should be set to the dialog instead.
			 */
			if ( modalLabel ) {
				self.setAttribute('aria-label', modalLabel);
			}
			else {
				if ( heading ) {
					var makeHeading = self.id + '_heading';
					heading.classList.add(getClass + '__heading');
					heading.id = makeHeading;

					/**
					 * Set an aria-labelledby to the modal dialog container.
					 */
					self.setAttribute('aria-labelledby', makeHeading);

					if ( heading.hasAttribute('data-autofocus') ) {
						heading.tabIndex = '-1';
					}
				}
				else {
					console.warn('Dialogs should have their purpose conveyed by a heading element (h1).');
				}
			}

			/**
			 * If a dialog has a data-modal-hide-heading attribute, then that means this
			 * dialog's heading should be visually hidden.
			 */
			if ( hideHeading ) {
				self.querySelector('#' + heading.id).classList.add('at-only');
			}

			/**
			 * Get all focusable elements from within a dialog and set the
			 * first and last elements to have respective classes for later looping.
			 */
			var focusable = self.querySelectorAll(tabFocusElements);
			focusable[0].classList.add(firstClass);
			focusable[focusable.length - 1].classList.add(lastClass);
		}
	}; // ARIAmodal.setupModal


	/**
	 * Setup any necessary close buttons, and add appropriate
	 * listeners so that they will close their parent modal dialog.
	 */
	ARIAmodal.setupModalCloseBtn = function ( self, modalClass, modalType ) {
		var doNotGenerate = self.hasAttribute('data-modal-manual-close');
		var manualClose = self.querySelectorAll('[data-modal-close-btn]');
		var modalClose = self.getAttribute('data-modal-close');
		var modalCloseClass = self.getAttribute('data-modal-close-class');
		var closeIcon = '<span data-modal-x></span>';
		var btnClass = modalClass;
		var i;

		if ( !doNotGenerate ) {
			if ( manualClose.length < 2 ) {
				var closeBtn = doc.createElement('button');
				closeBtn.type = 'button';

				/**
				 * If a custom class is set, set that class
				 * and create BEM classes for direct child elements.
				 *
				 * If no custom class set, then use default "a11y-modal" class.
				 */
				self.classList.add(modalClass);
				closeBtn.classList.add(modalClass + '__close-btn');

				/**
				 * If there is no data-modal-close attribute, or it has no set value,
				 * then inject the close button icon and text into the generated button.
				 *
				 * If the data-modal-close attribute has a set value, then use that as the
				 * visible text of the close button, and do not position it in the upper right
				 * of the modal dialog.
				 */
				if ( !modalClose && modalType !== 'alert' ) {
					closeBtn.innerHTML = closeIcon;
					closeBtn.setAttribute('aria-label', 'Close');
					closeBtn.classList.add('is-icon-btn');
				}
				else {
					closeBtn.innerHTML = modalClose;

					if ( modalCloseClass ) {
						closeBtn.classList.add(modalCloseClass);
					}
				}

				if ( modalType !== 'alert' ) {
					if ( self.querySelector('[role="document"]') ) {
						self.querySelector('[role="document"]').appendChild(closeBtn);
					}
					else {
						self.appendChild(closeBtn);
					}
				}

				closeBtn.addEventListener('click', ARIAmodal.closeModal);
			}
		}

		for ( i = 0; i < manualClose.length; i++ ) {
			manualClose[i].addEventListener('click', ARIAmodal.closeModal);
		}

		doc.addEventListener('keydown', ARIAmodal.keyEvents, false);
	}; // ARIAmodal.setupModalCloseBtn


	/**
	 * Actions
	 */
	ARIAmodal.openModal = function ( e, autoOpen ) {
		var i;
		var getTargetModal = autoOpen || this.getAttribute('data-modal-open');
		// Update the activeModal
		activeModal = doc.getElementById(getTargetModal);

		var focusTarget = activeModal; // default to the modal dialog container
		var getAutofocus = activeModal.querySelector('[autofocus]') || activeModal.querySelector('[data-autofocus]');

		useAriaModal = activeModal.hasAttribute('aria-modal');

		/**
		 * If a modal dialog was auto-opened, then a user should
		 * be returned to the top of the document when the modal
		 * is closed, so that they do not have to figure out where
		 * they've been placed in the DOM
		 */
		if ( autoOpen ) {
			returnToBody = true;
		}

		/**
		 * If a modal was auto-opened on page load, then the
		 * following do not apply.
		 */
		if ( !autoOpen ) {
			/**
			 * In case these are links, negate default behavior and just
			 * do what this script tells these triggers to do.
			 */
			e.preventDefault();

			/**
			 * Keep track of the trigger that opened the initial dialog.
			 */
			initialTrigger = this.id;
		}

		/**
		 * If a modal dialog contains an that is meant to be autofocused,
		 * then focus should be placed on that element (likely form control),
		 * instead of the wrapping dialog container.
		 *
		 * If a dialog has an attribute indicating the close button should
		 * be autofocused, focus the first close button found.
		 */
		if ( getAutofocus ) {
			focusTarget = getAutofocus;
		}
		else if ( activeModal.hasAttribute('data-modal-close-focus') ) {
			focusTarget = activeModal.querySelector('[class*="close-btn"]');
		}

		/**
		 * Do a check to see if a modal is already open.
		 * If not, then add a class to the body as a check
		 * for other functions and set contents other than
		 * the opened dialog to be hidden from screen readers
		 * and to not accept tab focus, nor for their child elements.
		 */
		if ( !body.classList.contains(activeClass) ) {
			body.classList.add(activeClass);

			for ( i = 0; i < children.length; i++ ) {
				if ( !useAriaModal ) {
					if ( children[i].hasAttribute('aria-hidden') ) {
						children[i].setAttribute('data-keep-hidden', children[i].getAttribute('aria-hidden') );
					}
					children[i].setAttribute('aria-hidden', 'true');
				}

				if ( children[i].getAttribute('inert') ) {
					children[i].setAttribute('data-keep-inert', '');
				}
				else {
					children[i].setAttribute('inert', 'true');
				}
			}
		}
		else {
			console.warn('It is not advised to open dialogs from within other dialogs. Instead consider replacing the contents of this dialog with new content. Or providing a stepped, or tabbed interface within this dialog.');
		}

		activeModal.removeAttribute('hidden');

		// Mostly reliable fix for iOS issue where VO focus is not moved
		// to the dialog on open. Credit to Thomas Jaggi - codepen.io/backflip
		// for the fix.
		requestAnimationFrame(function () {
	    focusTarget.focus();
	  });

		doc.addEventListener('click', ARIAmodal.outsideClose, false);
		doc.addEventListener('touchend', ARIAmodal.outsideClose, false);

		return [initialTrigger, activeModal, returnToBody];
	};


	/**
	 * Function for closing a modal dialog.
	 * Remove inert, and aria-hidden from non-dialog parent elements.
	 * Remove activeClass from body element.
	 * Focus the appropriate element.
	 */
	ARIAmodal.closeModal = function ( e ) {
		var trigger = doc.getElementById(initialTrigger) || null;
		var i;
		var m;

		/**
		 * Loop through all the elements that were hidden to
		 * screen readers, and had inert to negate their
		 * children from being focusable.
		 */
		for ( i = 0; i < children.length; i++ ) {
			if ( !children[i].hasAttribute('data-keep-inert') ) {
				children[i].removeAttribute('inert');
			}

			children[i].removeAttribute('data-keep-inert');

			if ( children[i].getAttribute('data-keep-hidden') ) {
				children[i].setAttribute('aria-hidden', children[i].getAttribute('data-keep-hidden') );
			}
			else {
				children[i].removeAttribute('aria-hidden');
			}

			children[i].removeAttribute('data-keep-hidden');
		}

		/**
		 * When a modal closes:
		 * the modal-open flag on the body can be removed,
		 * and the modal should be reset to hidden.
		 */
		body.classList.remove(activeClass);

		for ( m = 0; m < modal.length; m++ ) {
			if ( !modal[m].hasAttribute('hidden') ) {
				modal[m].hidden = true;
			}
		}

		/**
		 * Return focus to the trigger that opened the modal dialog.
		 * If the trigger doesn't exist for some reason, move focus to
		 * either the <main>, or <body> instead.
		 * Reset initialTrigger and activeModal since everything should be reset.
		 */
		if ( trigger !== null ) {
			trigger.focus();
		}
		else {
			if ( main && !returnToBody ) {
				main.tabIndex = -1;
				main.focus();
			}
			else {
				body.tabIndex = -1;
				body.focus();
			}
		}

		initialTrigger = undefined;
		activeModal = undefined;
		returnToBody = false;

		return [initialTrigger, activeModal, returnToBody];
	};


	/**
	 * Keyboard controls for when the modal dialog is open.
	 * ESC should close the dialog (when not an alert)
	 */
	ARIAmodal.keyEvents = function ( e ) {
		var keyCode  = e.keyCode || e.which;
		var escKey   = 27;
		var enterKey = 13;
		var spaceKey = 32;
		var tabKey   = 9;

		if ( e.target.hasAttribute('data-modal-open') ) {
			switch ( keyCode ) {
				case enterKey:
				case spaceKey:
					e.preventDefault();
					e.target.click();
				break;
			}
		}

		if ( body.classList.contains(activeClass) ) {
			switch ( keyCode ) {
				case escKey:
					ARIAmodal.closeModal();
					break;

				default:
					break;
			}

			if ( body.classList.contains(activeClass) ) {
				// Get first and last focusable elements from activeModal
				var firstFocus = activeModal.querySelector('.' + firstClass);
				var lastFocus = activeModal.querySelector('.' + lastClass);
			}

			if ( doc.activeElement.classList.contains(lastClass) ) {
				if ( keyCode === tabKey && !e.shiftKey ) {
					e.preventDefault();
					firstFocus.focus();
				}
			}

			if ( doc.activeElement.classList.contains(firstClass) ) {
				if ( keyCode === tabKey && e.shiftKey ) {
					e.preventDefault();
					lastFocus.focus();
				}
			}
		}
	}; // ARIAmodal.keyEvents()


	/**
	 * If a dialog is opened and a user mouse clicks or touch screen taps outside
	 * the visible bounds of the dialog content (onto the overlay 'screen') then
	 * the dialog should run the close function.
	 */
	ARIAmodal.outsideClose = function ( e ) {
		if ( body.classList.contains(activeClass) && !e.target.hasAttribute('data-modal-open') ) {
			var isClickInside = activeModal.contains(e.target);

			if ( !isClickInside && activeModal.getAttribute('role') !== 'alertdialog') {
				ARIAmodal.closeModal();
			}
		}
	}; // ARIAmodal.outsideClose()


	/**
	 * Open a modal dialog on page load
	 */
	ARIAmodal.autoLoad = function ( ) {
		var getAuto = doc.querySelectorAll('[data-modal-auto]');
		var hashValue = w.location.hash || null;
		var autoOpen;
		var useHash = false;
		var e = null;

		/**
		 * A modal ID in the URL should take precedent over any data attributes on
		 * the page. The script must first check if a hash exists, and then if so,
		 * does it match an ID in the document? And finally, is that ID associated
		 * with a modal dialog?  If so, set useHash to TRUE.
		 */
		if ( hashValue !== null ) {
			autoOpen = hashValue.split('#')[1];

			// stop right here if a stray hash is at the end of the URL
			if ( autoOpen === '' ) {
				return false;
			}
			else if ( autoOpen === '!null' ) {
				return false
			}
			else {
				// Check that the hash actually represent an element, or is it null?
				var checkforDialog = doc.getElementById(autoOpen) || null;

				// If not null...
				if ( checkforDialog !== null ) {
					// Do a final check to ensure the hash/ID is for a dialog or alertdialog
					// and if so, return useHash as TRUE
					if ( checkforDialog.getAttribute('role') === 'dialog' || checkforDialog.getAttribute('role') === 'alertdialog') {
						useHash = true;
					}
				}
			}
		}

		/**
		 * Since only a single modal should be open at a time, perform the following
		 * if/else checks:
		 *
		 * If a URL contains a fragment that matches the ID of a dialog, auto open it.
		 *
		 * Else If the attribute was found on a dialog container, then directly perform
		 * the openModal function.
		 *
		 * Else If a button or "button" was found with the attribute data-modal-auto,
		 * then perform a click to auto-open this dialog.
		 *
		 * If a dialog or button does not have the attribute data-modal-auto-persist,
		 * then update the URL fragment to a value that will not open a modal dialog on
		 * subsequent reloads.
		 *
		 * If data-modal-auto-persist does exist, then you can continue to bother your
		 * users with likely a poor user experience. :)
		 */

		if ( useHash ) {
			ARIAmodal.openModal( e, autoOpen );

			if ( getAuto.length > 1 ) {
				console.warn('Only the modal indicated by the hash value will load.')
			}
		}
		else if ( getAuto.length !== 0 ) {
			if ( getAuto[0].getAttribute('role') === 'dialog' || getAuto[0].getAttribute('role') === 'alertdialog' ) {

				autoOpen = getAuto[0].id;
				ARIAmodal.openModal( e, autoOpen );

				if ( getAuto.length > 1 ) {
					console.warn('Multiple modal dialogs can not auto load.')
				}
			}
			else if ( getAuto[0].getAttribute('role') === 'button' || getAuto[0].tagName === 'BUTTON' ) {
			 	autoOpen = getAuto[0].id;
			 	getAuto[0].click();
			}
		}

		/**
		 * Ideally a user shouldn't have to be barraged with the same modal dialog over
		 * and over again, if they refresh their browser window.
		 *
		 * So unless the attribute "data-modal-auto-persist" exists, which should be used
		 * to specifically state that a particular dialog should continue to auto-load,
		 * regardless of page refresh, modify the URL fragment to a string that will
		 * not auto-load a modal.
		 */
		if ( getAuto.length !== 0 && !doc.getElementById(autoOpen).hasAttribute('data-modal-auto-persist') ) {
			w.location.replace("#!null");
		}
	};


	/**
	 * Initialize modal functions.
	 * If expanding this script, put
	 * additional initialize functions here.
	 */
	ARIAmodal.init = function () {
		ARIAmodal.organizeDOM();
		ARIAmodal.setupTrigger();
		ARIAmodal.setupModal();
		ARIAmodal.autoLoad();
	};


	/**
	 * Go go JavaScript!
	 */
	ARIAmodal.init();

})( window, document );
