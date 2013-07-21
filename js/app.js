$(document).ready(function() {
    // Load default language
    loadLang('en');

    // Call changeIntroText() every 2 seconds
    // This will call the function so that it will alternate the text
    window.setInterval(alternateIntroText, 2000);

    // HTML documents reference
    var PAGE_HOME = "index.html";
    var PAGE_DEPARTMENTS = "store-departments.html";
    var PAGE_SEARCH = "store-search.html";
    var PAGE_CART = "shopping-cart.html";
    var PAGE_CHECKOUT = "checkout.html";

    // Status
    var current_page = PAGE_HOME;

    // Global selectors (used by more than one function)
    var search_table = "";
    var amount_span = "";

    // Shopping cart data
    var items = [];
    var amount = 0;

    // List of events to be placed in onLaunch()
    function onLaunch() {
        // Event: Start button click
        $(document).on("click", "#start-button", function() {
            // Load the selected language by taking the data attribute from the button
            loadLang($(this).data("lang"));

            $("#content").load(PAGE_DEPARTMENTS, onStart);
        });

        // Event: Cancel order modal
        $(document).on("click", "#cancel-order-modal-cancel-button", function() {
            $("#cancel-order-modal").modal("hide");
            forceExit();
        });
        $(document).on("click", "#cancel-order-modal-no-button", function() {
            $("#cancel-order-modal").modal("hide");
        });

        // Event: Checkout modal
        $(document).on("click", "#checkout-modal-cancel-button", function() {
            $("#checkout-modal").modal("hide");

            // Clean the modal so next time the modal is opened, it will be cleared and won't show the old data
            clearCheckoutModal();
        });
        $(document).on("click", "#checkout-modal-checkout-button", function() {
            onCheckout();
        });

        // Event: Store navigation click
        $(document).on("click", "#shop-nav li a", function() {
            var page = $(this).attr('href');
            var toLoad = page+' #store-content';
            $('#store-content').load(toLoad, function() {
                switch(page) {
                    case PAGE_DEPARTMENTS:
                        onDepartmentsStart();
                        break;
                    case PAGE_SEARCH:
                        onSearchStart();
                        break;
                    case PAGE_CART:
                        onCartStart();
                        break;
                }
            });
            $("#shop-nav li").removeClass("active");
            $(this).closest("li").addClass("active");
            return false;
        });

        // Event: Search live filter
        $(document).on("keyup", "#store-search-input", function(event) {
            var value_entered = $(this).val();
            if(value_entered != "") {

                // Show only matching TR, hide rest of them
                var error_row = search_table.find("#no-records-found");
                search_table.find("tr:gt(0)").hide();
                var columns = search_table.find("td#item-name:contains-ci('" + value_entered + "')");

                // If the number of columns is more than 0
                if(columns.length > 0) {
                    // Hide the error row and show the matched row
                    error_row.hide();
                    columns.parent("tr").show();
                }
                else {
                    // If there are no match, just show the error row
                    error_row.show();
                }
            }
            else {
                // When there is no input or clean again, show everything back (except the #no-records-found row)
                search_table.find("tr:not('#no-records-found')").show();
            }
        });

        // Event: Add to cart button
        $(document).on("click", "#add-to-cart", function() {
            // Send item id to onAddToCart
            var row = $(this).closest("tr");
            var qty = row.find("#qty");

            if(parseInt(qty.html()) == 0) {
                // Change row color and show the buttons
                row.removeClass("info").addClass("success");

                // Show remove and clear buttons
                row.find("#remove-from-cart, #clear-item-from-cart").show();
            }

            onAddToCart(row.data("item-id"), row.find("#item-name").html(), row.find("#price").html(), qty.html());

            // Increment in the HTML
            qty.html(parseInt(qty.html()) + 1);
        });

        // Event: Remove from cart button
        $(document).on("click", "#remove-from-cart", function() {
            var row = $(this).closest("tr");
            var qty = row.find("#qty");

            // If more than 0, decrement. This is to prevent negative qty
            if(parseInt(qty.html()) > 0) {
                if(parseInt(qty.html()) == 1) {
                    // If shopping cart page, then there's a different behaviour
                    if(current_page == PAGE_CART) {
                        // Check number of siblings this row has
                        if(row.siblings().length == 2) {
                            // If it has 2, means the header row, and the error, so basically this is the only row left
                            // In this case, show the error message
                            row.siblings(".error").show();
                        }

                        // The whole row is removed if it's the last item
                        row.remove();
                    }
                    else {
                        // If this is not the shopping cart
                        // You removed last item so return back to normal
                        row.removeClass("success").addClass("info");

                        // Remove the remove and clear buttons
                        row.find("#remove-from-cart, #clear-item-from-cart").hide();
                    }
                }

                // This will run when quantity is more than 0, otherwise it's a waste of resources
                onRemoveFromCart(row.data("item-id"), qty.html());

                // Decrement quantity in the HTML
                qty.html(parseInt(qty.html()) - 1);
            }
        });

        // Event: Clear item from cart button
        $(document).on("click", "#clear-item-from-cart", function() {
            var row = $(this).closest("tr");
            var qty = row.find("#qty");

            // If more than 0, then clear
            if(parseInt(qty.html()) > 0) {
                // If shopping cart page, then there's a different behaviour
                if(current_page == PAGE_CART) {
                    // Check number of siblings this row has
                    if(row.siblings().length == 2) {
                        // If it has 2, means the header row, and the error, so basically this is the only row left
                        // In this case, show the error message
                        row.siblings(".error").show();
                    }

                    // The whole row is removed if it's the last item
                    row.remove();
                }
                else {
                    // If this page isn't shopping cart, then do the following

                    // Return row back to normal
                    row.removeClass("success").addClass("info");

                    // Remove the remove and clear buttons
                    row.find("#remove-from-cart, #clear-item-from-cart").hide();
                }

                // Run the actual method
                onClearItemFromCart($(this).closest("tr").data("item-id"));

                // Change the quantity to 0 in the HTML
                qty.html(0);
            }
        });
    }

    function onStart() {
        $("#cancel-button").show();

        amount_span = $("span#amount"); // This will also select the modal span

        // Fire up onDepartmentsStart because that's the first page to be loaded
        onDepartmentsStart();

        // Load lang text for the page
        updateLangText();
    }

    function onExit() {
        // Clear items for the new session
        items = [];
        amount = 0;

        // Update page status
        current_page = PAGE_HOME;

        $("#cancel-button").hide();

        // Load the default language which is English
        // updateLang() doesn't need to be called again because loadLang calls it
        loadLang('en');
    }

    // This is kept here so that it will be forced to closed and it's kept separately to prevent code duplication
    function forceExit() {
        $("#container").load(PAGE_HOME+" #container", onExit);
    }

    function onDepartmentsStart() {
        // Update page status
        current_page = PAGE_DEPARTMENTS;

        // Keeping this variable outside for scope
        var departmentsIdList = new Array();
        $.ajax("database.php?table=department")
            .done(function(data) {
                var departments = $.parseJSON(data);
                var departments_div = $("#store-departments-departments");
                var items_div = $("#store-departments-items");
                var departments_HTML = "";
                var items_HTML = "";
                $.each(departments, function(index, value) {
                    departments_HTML += "<li><a href='#dept"+value.department_id+"' data-toggle='tab'>"+value.name+"</a></li>";
                    items_HTML += "<div class='tab-pane' id='dept"+value.department_id+"'></div>";
                    departmentsIdList.push(value.department_id);
                });
                departments_div.append(departments_HTML);
                items_div.append(items_HTML);

                // Make the first elements active by giving it an active class
                departments_div.find("li:first").addClass("active");
                items_div.find("div:first").addClass("active");
            })
            .complete(function(jqXHR, textStatus) {
                var items_div = $("#store-departments-items");
                $.each(departmentsIdList, function(index, value) {
                    $.ajax("database.php?table=item&department_id="+value)
                        .done(function(data) {
                            var items = $.parseJSON(data);
                            var HTML = "<table class='table'><tr><th id='lang-product-name'>[product-name]</th><th id='lang-price'>[price]</th><th id='lang-quantity'>[quantity]</th><th><i class='icon-shopping-cart'></i></th></tr>";
                            if(items.length > 0) {
                                $.each(items, function(j, item) {
                                    HTML += "<tr class='info' data-item-id='"+item.item_id+"'><td id='item-name'>"+item.name+"</td><td id='price'>"+item.price+"</td><td><span id='qty' class='badge badge-info'>0</span></td><td><button id='add-to-cart' class='btn'><i class='icon-plus'></i></button> <button id='remove-from-cart' class='btn hide'><i class='icon-minus'></i></button> <button id='clear-item-from-cart' class='btn btn-danger hide'><i class='icon-remove icon-white'></i></button></td></tr>";
                                });
                            }
                            else {
                                HTML += "<tr class='error'><td colspan='4'><i class='icon-exclamation-sign'></i> <i id='lang-empty-department'>[empty-department]</i></td></tr>";
                            }
                            HTML += "</table>";
                            items_div.find("div#dept"+value).append(HTML);
                        })
                        .complete(function(jqXHR, textStatus) {
                            refreshView();

                            // Load lang text for the page
                            // This is done here because we have to wait for all the elements to be in the DOM
                            updateLangText();
                        });
                });
            })
            .fail(function(jqXHR, textStatus) {
                forceExit();
                alert("Sorry, there seems to be a connection error");
            });
    }

    function onSearchStart() {
        // Update page status
        current_page = PAGE_SEARCH;

        $.ajax("database.php?table=item")
            .done(function(data) {
                var items = $.parseJSON(data);
                search_table = $("#store-search-table");
                var HTML = "";
                if(items.length > 0) {
                    $.each(items, function(index, value) {
                        HTML += "<tr class='info' data-item-id='"+value.item_id+"'><td id='item-name'>"+value.name+"</td><td id='price'>"+value.price+"</td><td><span id='qty' class='badge badge-info'>0</span></td><td><button id='add-to-cart' class='btn'><i class='icon-plus'></i></button> <button id='remove-from-cart' class='btn hide'><i class='icon-minus'></i></button> <button id='clear-item-from-cart' class='btn btn-danger hide'><i class='icon-remove icon-white'></i></button></td></tr>";
                    });
                }
                else {
                    HTML += "<tr class='error'><td colspan='4'><i class='icon-exclamation-sign'></i> <i>No records found.</i></td></tr>";
                }
                search_table.append(HTML);
                refreshView();
            })
            .fail(function(jqXHR, textStatus) {
                forceExit();
                alert("Sorry, there seems to be a connection error");
            });

        // Load lang text for the page
        updateLangText();
    }

    function onCartStart() {
        // Update page status
        current_page = PAGE_CART;

        // To store the row content
        var HTML = "";

        // If cart is not empty, then add items to it, otherwise do nothing
        if(!$.isEmptyObject(items)) {
            $.each(items, function(index, value) {
                // By default the HTML should have the buttons and styles instead of re-adding and checking
                HTML += "<tr class='success' data-item-id='"+value.id+"'><td id='item-name'>"+value.name+"</td><td id='price'>"+value.unit_price+"</td><td><span id='qty' class='badge badge-info'>"+value.qty+"</span></td><td><button id='add-to-cart' class='btn'><i class='icon-plus'></i></button> <button id='remove-from-cart' class='btn'><i class='icon-minus'></i></button> <button id='clear-item-from-cart' class='btn btn-danger'><i class='icon-remove icon-white'></i></button></td></tr>";
            });

            // Select table
            var cart_table = $("table#store-shopping-cart");

            // Hide the error row because we do have more than 0 items
            cart_table.find(".error").hide();

            // Add rows to table
            cart_table.append(HTML);
        }

        // Load lang text for the page
        updateLangText();
    }

    function onAddToCart(item_id, item_name, unit_price, current_qty) {
        // If the quantity is 0
        if(current_qty == 0) {
            // Create new object and add it directly
            cart_item = {};
            cart_item.id = item_id;
            cart_item.name = item_name;
            cart_item.unit_price = unit_price;
            cart_item.qty = 1; // First item
            items.push(cart_item);
        }
        else {
            // Otherwise just increment the quantity
            // Get index of item from array
            var index = containsObjectWithId(item_id, items);
            items[index].qty = items[index].qty + 1;
        }

        // Add to amount
        amount += parseFloat(unit_price);

        // Update checkout button visibility
        checkoutButtonVisibility();

        // Update amount
        updateAmount();
    }

    function onRemoveFromCart(item_id, current_qty) {
        // Get index
        var index = containsObjectWithId(item_id, items);

        // Remove amount
        amount -= items[index].unit_price;

        // If last item, remove it from the array
        if(current_qty == 1) {
            // Remove one item from that index
            items.splice(index, 1);
        }
        else {
            // Otherwise just decrement
            items[index].qty = items[index].qty - 1;
        }

        // Update checkout button visibility
        checkoutButtonVisibility();

        // Update amount
        updateAmount();
    }

    function onClearItemFromCart(item_id) {
        // Get index
        var index = containsObjectWithId(item_id, items);

        // Get total of the item by calculating the qty and unit price for the item
        var item_total = items[index].qty * items[index].unit_price;

        // Remove one item from that index
        items.splice(index, 1);

        // Remove from amount
        amount -= item_total;

        // Update checkout button visibility
        checkoutButtonVisibility();

        // Update amount
        updateAmount();
    }

    // This is used for both departments section and search section
    function refreshView() {
        var matched_elements = $("tr").filter(function() {
            // If the item is in the array, select it

            // Get the index from the items array
            var index = containsObjectWithId($(this).data("item-id"), items);

            // If index is not -1 (then it means it's in the array)
            if(index != -1) {
                // Update the quantity
                $(this).find("#qty").html(items[index].qty);

                // Return true to select it in the filter
                return true;
            }
            else {
                // Return false so that it won't be selected
                return false;
            }
        });

        // Change row background and show the other buttons
        matched_elements.removeClass("info").addClass("success");
        matched_elements.find("#remove-from-cart, #clear-item-from-cart").show();
    }

    // Hide/show checkout button
    function checkoutButtonVisibility() {
        if(items.length == 0) {
            $("#checkout-button").hide();
        }
        else {
            $("#checkout-button").show();
        }
    }

    function updateAmount() {
        amount_span.html(toFixed(amount, 3));
    }

    // This is executed when the use clicks on the Checkout button on the modal
    function onCheckout() {
        var phone_number_field = $("#phone-number");

        // Validate the phone number
        // If valid, add to DB, otherwise show error
        if(phoneNumberValidate(phone_number_field.val())) {
            // If valid, hide the modal and load the checkout page
            $("#checkout-modal").modal("hide");

            // Construct an object for post data
            var postData = {};
            postData.phone_number = phone_number_field.val();
            postData.amount = amount;
            postData.items = JSON.stringify(items);

            // Send data to order table
            $.post("database.php?table=order&action=create", postData, function() {

            })
            .error(function() {
                //alert("An error has occured, please try again.");
            });

            // Clean modal input
            clearCheckoutModal();

            // Load the checkout screen
            $("#content").load(PAGE_CHECKOUT, function() {
                current_page = PAGE_CHECKOUT;
            });

            // Hide the cancel and checkout buttons
            $("#cancel-button").hide();
            $("#checkout-button").hide();

            // Bind action to close checkout button
            $(document).on("click", "#close-checkout", function() {
                forceExit();
            });

            // Load lang text for the page
            updateLangText();
        }
        else {
            // Show error alert
            $("#checkout-phone-number-error").show();
        }
    }

    function clearCheckoutModal() {
        // Clear phone number field so that it won't show the same number again in the next session
        $("#phone-number").val("");

        // Hide error alert just in case it was shown so that it won't be shown by default in the next session
        $("#checkout-phone-number-error").hide();
    }

    // Loads a language
    function loadLang(lang) {
        $.i18n.properties({
            name:'Lang',
            path:'languages/',
            mode:'both',
            language:lang,
            callback: function() {
                updateLangText();
            }
        });

        // Change direction based on language and use the right file (RTL/LTR support for bootstrap)
        $("html").attr("dir", $.i18n.prop('dir'));
        $("link#bootstrap-main").attr("href", $.i18n.prop("bootstrap_main_file"));
        $("link#bootstrap-responsive").attr("href", $.i18n.prop("bootstrap_responsive_file"));
    }

    // Update the text based on the language selected
    function updateLangText() {
        // Load text based on current page
        switch(current_page) {
            case PAGE_HOME:
                $("span#lang-title").text($.i18n.prop('title'));
                $("span#lang-footer").text($.i18n.prop('footer'));

                // This put the default Choose Language text, then the alternateIntroText() will keep alternating it
                $("h1#lang-choose-lang").text($.i18n.prop('choose_lang_en'));
                break;

            // Most initializations for components will go here in departments page
            // The reason is this is the starting point
            case PAGE_DEPARTMENTS:
                // Navigation (put under departments because that's where they're initialized
                $("a#lang-select-your-items").text($.i18n.prop('select_your_items'));
                $("a#lang-search-items").text($.i18n.prop('search_items'));
                $("a#lang-shopping-cart").text($.i18n.prop('shopping_cart'));

                // Modals
                $("h3#lang-checkout-title").text($.i18n.prop('checkout')); // Suffixed with title to prevent ID duplicate
                $("legend#lang-your-details").text($.i18n.prop('your_details'));
                $("label#lang-phone-number").text($.i18n.prop('phone_number'));
                $("div#checkout-phone-number-error").text($.i18n.prop('invalid_phone_number_error')); // Exception because it already has an ID
                $("a#checkout-modal-cancel-button").text($.i18n.prop('cancel')); // Exception because it already has an ID
                $("p#lang-cancel-order-confirmation").text($.i18n.prop('cancel_order_confirmation'));
                $("h3#lang-cancel-order-title").text($.i18n.prop('cancel_order'));
                $("span#lang-cancel-order-button").text($.i18n.prop('cancel_order'));
                $("a#cancel-order-modal-no-button").text($.i18n.prop('no')); // Exception because it already has an ID

                // Buttons
                $("span#lang-cancel-order").text($.i18n.prop('cancel_order'));
                $("span#lang-checkout-button").text($.i18n.prop('checkout'));

                $("i#lang-empty-department").text($.i18n.prop('empty_department'));
                break;

            case PAGE_SEARCH:
                $("input#store-search-input").attr("placeholder", $.i18n.prop("search_input_placeholder")); // Only exception because already has ID
                break;

            case PAGE_CART:

                $("i#lang-empty-cart").text($.i18n.prop("empty_cart"));
                break;

            case PAGE_CHECKOUT:
                $("p#lang-checkout-text").text($.i18n.prop("checkout_text"));
                $("button#close-checkout").text($.i18n.prop("back_to_main_screen")); // Exception because it already has an ID
                break;
        }

        // Shared properties for departments, search, and cart
        if(current_page == PAGE_DEPARTMENTS || current_page == PAGE_SEARCH || current_page == PAGE_CART) {
            // Table heads
            $("th#lang-product-name").text($.i18n.prop('product_name'));
            $("th#lang-price").text($.i18n.prop('price'));
            $("th#lang-quantity").text($.i18n.prop('quantity'));
        }
    }

    function containsObjectWithId(id, list) {
        var i;
        for (i = 0; i < list.length; i++) {
            if (list[i].id == id) {
                return i;
            }
        }
        return -1;
    }

    // For rounding a float
    function toFixed(value, precision) {
        var precision = precision || 0,
            neg = value < 0,
            power = Math.pow(10, precision),
            value = Math.round(value * power),
            integral = String((neg ? Math.ceil : Math.floor)(value / power)),
            fraction = String((neg ? -value : value) % power),
            padding = new Array(Math.max(precision - fraction.length, 0) + 1).join('0');

        return precision ? integral + '.' +  padding + fraction : integral;
    }

    function alternateIntroText() {
        var intro_text_elem = $("h1#lang-choose-lang");
        if(intro_text_elem.text() == $.i18n.prop('choose_lang_en')) {
            intro_text_elem.fadeOut(function() {
                $(this).text($.i18n.prop('choose_lang_ar')).fadeIn();
            });
        }
        else {
            intro_text_elem.fadeOut(function() {
                $(this).text($.i18n.prop('choose_lang_en')).fadeIn();
            });
        }
    }

    // Phone number validation
    function phoneNumberValidate(phone_number) {
        var numbers = /^[0-9]+$/;

        // If the number is all numbers, and it's length is 8, and the first number is 9, then it's valid
        if(phone_number.match(numbers) && phone_number.length == 8 && phone_number.charAt(0) == '9') {
            return true;
        }
        else {
            return false;
        }
    }

    // Launch the application
    onLaunch();

});

// jQuery expression for case-insensitive filter
$.extend($.expr[":"], {
    "contains-ci": function(elem, i, match, array) {
        return (elem.textContent || elem.innerText || $(elem).text() || "").toLowerCase().indexOf((match[3] || "").toLowerCase()) >= 0;
    }
});