<?php
ini_set('display_errors', 'Off');
ini_set('display_startup_errors', 'Off');
error_reporting(0);

include("config/db-config.php");

// Connection to the database
$dbhandle = mysql_connect($dbhost, $dbuser, $dbpass);
if(!$dbhandle) {
	header('HTTP', true, 404);
	exit(0);
}

$selected = mysql_select_db($dbname, $dbhandle);
if(!$selected) {
	header('HTTP', true, 404);
	exit(0);
}

if($_REQUEST['table'] == "department") {
	if(empty($_REQUEST['id'])) {
		$result = mysql_query("SELECT * FROM departments");
		$rows = array();
		while($r = mysql_fetch_assoc($result)) {
    			$rows[] = $r;
		}
		echo json_encode($rows);
		exit(0);
	}
	else {
		$id = $_REQUEST['id'];
		$result = mysql_query("SELECT * FROM departments WHERE department_id = '$id'");
		$rows = array();
		while($r = mysql_fetch_assoc($result)) {
    			$rows[] = $r;
		}
		echo json_encode($rows);
		exit(0);
	}
}
else if($_REQUEST['table'] == "item") {
	if(!empty($_REQUEST['department_id'])) {
		$department_id = $_REQUEST['department_id'];
		$result = mysql_query("SELECT * FROM items WHERE department_id = '$department_id'");
		$rows = array();
		while($r = mysql_fetch_assoc($result)) {
    			$rows[] = $r;
		}
		echo json_encode($rows);
		exit(0);
	}
	else if(empty($_REQUEST['id'])) {
		$result = mysql_query("SELECT * FROM items");
		$rows = array();
		while($r = mysql_fetch_assoc($result)) {
    			$rows[] = $r;
		}
		echo json_encode($rows);
		exit(0);
	}
	else {
		$id = $_REQUEST['id'];
		$result = mysql_query("SELECT * FROM items WHERE item_id = '$id'");
		$rows = array();
		while($r = mysql_fetch_assoc($result)) {
    			$rows[] = $r;
		}
		echo json_encode($rows);
		exit(0);
	}
}
else if($_REQUEST['table'] == "order") {
	if($_REQUEST['action'] == "create") {
		$phone_number = $_REQUEST['phone_number'];
		$items = $_REQUEST['items'];
		$amount = $_REQUEST['amount'];
		$datetime = time();

		mysql_query("INSERT INTO `orders` (`order_id` ,`phone`, `datetime`, `items`, `amount`, `paid`, `delivered`) VALUES (NULL, '$phone_number', '$datetime', '$items', '$amount', '0', '0');");

		$order_no = mysql_insert_id();

		// Set default timezone
		date_default_timezone_set('Asia/Muscat');

		// Prepare customer receipt
		$lines = "Tel: +968 92577735".PHP_EOL;
		$lines .= "CUSTOMER COPY".PHP_EOL;
		$lines .= "USE THIS RECEIPT TO COLLECT YOUR ITEMS".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "Order number: ".$order_no.PHP_EOL;
		$lines .= "Customer phone number: ".$phone_number.PHP_EOL;
		$lines .= "Date and Time: ".date("d/m/Y H:i", $datetime).PHP_EOL;
		$lines .= "Total amount due: ".number_format($amount,3)." R.O.".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "____________________________________________________________________________".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "Thank you for using our electronic shopping system".PHP_EOL;
		$lines .= "Come again!".PHP_EOL;
		$lines .= "www.masaaroman.com".PHP_EOL;
		$my_file = 'output/Receipt_Customer.txt';
		$handle = fopen($my_file, 'w') or die('cannot open file:  '.$my_file);
		fwrite($handle, $lines);
		fclose($handle);

		// Prepare store receipt
		$items = json_decode($items);
		$lines = "Tel: +968 92577735".PHP_EOL;
		$lines .= "STORE COPY".PHP_EOL;
		$lines .= "PLEASE GIVE THIS RECEIPT TO OUR STAFF".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "Order number: ".$order_no.PHP_EOL;
		$lines .= "Customer phone number: ".$phone_number.PHP_EOL;
		$lines .= "Date and Time: ".date("d/m/Y H:i", $datetime).PHP_EOL;
		$lines .= "Total amount due: ".number_format($amount,3)." R.O.".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "____________________________________________________________________________".PHP_EOL;
		$lines .= PHP_EOL;
		foreach($items as $value) {
			$lines .= $value->name.PHP_EOL."Qty: ".$value->qty." - Unit Price: ".number_format($value->unit_price,3)." R.O. - Price: ".number_format($value->unit_price*$value->qty, 3)." R.O.".PHP_EOL.PHP_EOL;
		}
		$lines .= PHP_EOL;
		$lines .= "____________________________________________________________________________".PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= PHP_EOL;
		$lines .= "Thank you for using our electronic shopping system".PHP_EOL;
		$lines .= "Come again!".PHP_EOL;
		$lines .= "www.masaaroman.com".PHP_EOL;

		$my_file = 'output/Receipt_Store.txt';
		$handle = fopen($my_file, 'w') or die('cannot open file:  '.$my_file);
		fwrite($handle, $lines);
		fclose($handle);

		echo mysql_error();
		exit(0);
	}
}
// If not exited, means error, so show error
header('HTTP', true, 404);
?>