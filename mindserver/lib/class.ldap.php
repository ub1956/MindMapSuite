<?php
  /**
   * class.ldap.php
   * ----------
   * An Object oriented frontend for the PHP LDAP functions
   * 
   * This work is distributed within the terms of
   * creative commons attribution-share alike 3.0
   * 
   * See http://creativecommons.org/licenses/by-sa/3.0/ for more information
   * 
   * @author Alex Badent <abadent@gmail.com>
   * @license http://creativecommons.org/licenses/by-sa/3.0/ Creative Commons Attribution-Share Alike 3.0 Unported
   * @copyright Copyright &copy; 2010 Alex Badent   
   * 
   */

class ldap {
  public $server;
  protected $binddn;
  protected $bindpw;
  protected $conn;
  public $base;
  public $tls;
  
  
  public function __construct() {
    
  }
  
  /**
   * set class internal variables
   * @param $var variable
   * @param $val value
   * @return boolean
   */  
  public function _set ($var, $val) {
    if(!isset($this->$var)) {
      $this->$var = $val;
      return true;
    }
    return false;
  }
  
  public function debug() {
    return print_r($this,true);
  }
  
  
  /**
   * connect to given ldap server
   * @return boolean
   */
  public function connect() {
    if(!empty($this->server)) {
      $ldap_port = (empty($this->ldap_port))? 389 : $this->ldapport;
      $this->conn = @ldap_connect($this->server,$ldap_port);
      $this->tls();
      if($this->conn === FALSE) { return false; }
      return TRUE;
    }
  }
  

  /**
   * tls handling
   * @return boolean
   */
  private function tls() {
    if($this->tls === true && $this->conn !== false) {
      return @ldap_start_tls($this->conn);
    }
    return false;
  }
  

  /**
   * ldap bind handle bindig
   * @return boolean
   */
  public function bind() {
    if($this->conn === false) { return false;}
    return @ldap_bind($this->conn, $this->binddn, $this->bindpw);
  } 
  
  /**
   * wrapper for connect and bind
   * @return boolean
   */
  public function init_conn() {
    $return = $this->connect();
    $return = $this->bind();
    return $return;
  }
  
  /**
   * wrapper for ldap_search
   * @param string $filter the ldap filter
   * @param array $returns wich attributes should be returned default all user attribs
   * @return boolean
   */
  public function search ($filter, $returns=array("+")) {
  if(!is_string($filter)) { $this->throw_error(__CLASS__." ".__METHOD__.' $filter not type of string',E_USER_ERROR); return false;  }
  if(!is_array($returns)) { $this->throw_error(__CLASS__." ".__METHOD__.' $returns not type of array',E_USER_ERROR); return false;  }      
      
    $this->_search = @ldap_search($this->conn, $this->base, $filter, $returns);
    if ($this->_search !== false) {
      return TRUE;
    } else {
      return FALSE;
    } 
  } 
  
  /**
   * wrapper for ldap_count_entries
   * @return int number of last search results
   */
  public function count_sr() {
    return @ldap_count_entries($this->conn, $this->_search);  
  } 
  
  /**
   * wrapper for ldap_get_entries
   * @return array output of the last search
   */
  public function get_entries() {
    return @ldap_get_entries($this->conn, $this->_search);
  }
  
  /**
   * wrapper for ldap_unbind
   * @return boolean
   */
  public function unbind() {
    return (bool) ldap_unbind ($this->conn);
  } 
  
  /**
   * wrapper for ldap_close [php internal alias for ldap_unbind] 
   * @return boolean
   */
  public function close() {
    return (bool) ldap_close($this->conn);
  }
  
  /**
   * wrapper for ldap_add
   * @param string $dn
   * @param array $add_arr
   * @return boolean
   */
  public function add ($dn,$add_arr) {
    if(!is_string($dn)) { $this->throw_error(__CLASS__." ".__METHOD__.' $dn not type of string',E_USER_ERROR); return false;  }
    if(!is_array($add_arr)) { $this->throw_error(__CLASS__." ".__METHOD__.' $addr_array not type of array',E_USER_ERROR); return false;  }
    
    return (bool) @ldap_add($this->conn,$dn,$add_arr);
  }
  
  /**
   * wrapper for ldap_modify
   * @param string $dn
   * @param array $mod_arr
   */
  public function modify($dn,$mod_arr) {
      if(!is_string($dn)) { $this->throw_error(__CLASS__." ".__METHOD__.' $dn not type of string',E_USER_ERROR); return false;  }
    if(!is_array($mod_arr)) { $this->throw_error(__CLASS__." ".__METHOD__.' $mod_array not type of array',E_USER_ERROR); return false;  }
    
    return (bool) @ldap_modify($this->conn,$dn,$mod_arr);
  }
  
  /**
   * wrapper for ldap_delete
   * @param string $dn
   * @return boolean
   */
  public function delete($dn) {
    if(!is_string($dn)) { $this->throw_error(__CLASS__." ".__METHOD__.' $dn not type of string',E_USER_ERROR); return false;  }
    return (bool) @ldap_delete ( $this->conn , $dn );
    
  }
  
  /**
   * convert error id to string
   * @param int $err
   * @return string error
   */
  private function perr2str($err) {
    return (string) ldap_err2str($err); 
  }
  
  /**
   * get statuscode of the last operation 
   * @return int statuscode
   */
  public function errno() {
    return (int) ldap_errno ($this->conn); 
  }
  
  /**
   * wrapper for ldap_error
   * @return string error
   */
  public function error() {
    return (string) ldap_error($this->conn); 
  }
  
  /**
   * wrapper for ldap_rename
   * @param string $dn the dn which should be renamed/moved
   * @param string $newrdn the new rdn of the entry
   * @param string $parent the new parent of the entry (if none use NULL) 
   * @param bool   $deleteoldrdn delete the old rdn default FALSE 
   * @return boolean
   */
  public function rename($dn, $newrdn, $parent=NULL, $deleteoldrdn=FALSE) {
  if(!is_string($dn))          { $this->throw_error(__CLASS__." ".__METHOD__.' $dn not type of string',E_USER_ERROR); return false;  }
  if(!is_string($newrdn))      { $this->throw_error(__CLASS__." ".__METHOD__.' $newrdn not type of string',E_USER_ERROR); return false;  }
  if(!is_string($parent))      { $this->throw_error(__CLASS__." ".__METHOD__.' $parent not type of string',E_USER_ERROR); return false;  }
  if(!is_bool($deleteoldrdn))  { $this->throw_error(__CLASS__." ".__METHOD__.' $deleteoldrdn not type of bool',E_USER_ERROR); return false;  }
    return (bool) ldap_rename ($this->conn, $dn, $newrdn, $parent , $deleteoldrdn );
  }
  
  /**
   * wraper for ldap_set_option
   * @param int $option the option 
   * @param mixed $value the value
   * @return boolean
   */
  public function set_option($option, $value) {
    if(!is_int($option)) { $this->throw_error(__CLASS__." ".__METHOD__.' $option not type of integer',E_USER_ERROR); return false;  }
    return (bool) ldap_set_option ($this->conn, $option , $value );
  }
  
  
  /**
   * wrapper for ldap_get_option
   * @param int $option
   * @return mixed resultarray
   */
  public function get_option($option) {
    $success = @ldap_get_option($this->conn, $option, $$option);
    if ($success === FALSE) { return false; }
    else { return $$option; }
    
  }
  
  /**
   * generalized time 2 unix timestamp
   * @param $date
   * @return unix timestamp (UTC)
   */
  public function gtime2ts ($date) {
    $len = strlen($date);
    if($len == 15) {
      $offset = "Z";
    } else {
      $offset     = substr($date,15,4);
      $offset_dir = substr($date,14,1);
    }
    
    $year  = substr($date,0,4);
    $month = substr($date,4,2);
    $day   = substr($date,6,2);
    $hour  = substr($date,8,2);
    $minute= substr($date,10,2);
    $second= substr($date,12,2);
    
    if ($offset !== "Z") {
      $hour_offset   = substr($offset,0,2);
      $minute_offset = substr($offset,2,2);
      if ($offset_dir=="+") {
        $hour          = $hour - $hour_offset;
        $minute        = $minute - $minute_offset;
      } elseif ($offset_dir=="-") {
        $hour          = $hour + $hour_offset;
        $minute        = $minute + $minute_offset;
      } else {
        $this->throw_error(__CLASS__." ".__METHOD__.' $date contains an unknown offset',E_USER_ERROR);
        return false;
      }
    }
    
    return mktime($hour,$minute,$second,$month,$day,$year);
  }
  

  /**
   * convert an unix timestamp to generalized time
   * @param $ts unix timestamp
   * @param $format utc (default) or local
   * @return generalized time
   */
  public function ts2gtime ($ts=false, $format="utc") {
    if ($ts===false) {$ts = time(); }
    $offset = date("O");
    $offset_secs = date ("Z",$ts);
    if($format !== "utc") {
      $gdate_post = $offset;      
    } else {
      $ts = $ts - $offset_secs;
      $gdate_post = "Z";
    }
    $gdate = date("YmdHis",$ts);
    
    return $gdate.$gdate_post;
    
  }
  
   /**
    * generate ssha hash from password
    * @param string $pass
    * @return string hash
    */
   public function password_ssha($pass) {
     if(!is_string($pass)) { $this->throw_error(__CLASS__." ".__METHOD__.' $pass not type of string',E_USER_ERROR); return false;  }
      mt_srand((double)microtime()*1000000);
      $salt = pack("CCCC", mt_rand(), mt_rand(), mt_rand(), mt_rand());
      $hash = "{SSHA}" . base64_encode(pack("H*", sha1($pass . $salt)) . $salt);
      return (string)$hash;
   }
   
   /**
    * check password against given ssha hash
    * @param string hashed password $hash 
    * @param string password $pass
    * @return boolean
    */
   public function password_verify_ssha($hash, $pass) {
     if(!is_string($hash)) { $this->throw_error(__CLASS__." ".__METHOD__.' $hash not type of string',E_USER_ERROR); return false;  }
     if(!is_string($pass)) { $this->throw_error(__CLASS__." ".__METHOD__.' $pass not type of string',E_USER_ERROR); return false;  }
     // Verify SSHA hash
     $ohash = base64_decode(substr($hash, 6));
     $osalt = substr($ohash, 20);
     $ohash = substr($ohash, 0, 20);
     $nhash = pack("H*", sha1($pass . $osalt));
     if ($ohash == $nhash) {
       return TRUE;
     } else {
       return FALSE;
     }
   }
   
   
  /**
   * function to trigger errors
   * @param string $error
   * @param int $error_type
   * @return boolean
   */
  private function throw_error($error,$error_type=E_USER_NOTICE) {
    return trigger_error ($error , $error_type);
  }
  
  /**
   * converts an ldap status code to the apropriate error string
   * @param (int) $err
   * @return array ('code', 'desc') 
   */
  public function err2str($err) {
    $codes = array(
             0 => array('code' => 'LDAP_SUCCESS',                   'desc' => 'Success'),
             1 => array('code' => 'LDAP_OPERATIONS_ERROR',          'desc' => 'Operations error'),
             2 => array('code' => 'LDAP_PROTOCOL_ERROR',            'desc' => 'Protocol error'),
             3 => array('code' => 'LDAP_TIMELIMIT_EXCEEDED',        'desc' => 'Timelimit exceeded'),
             4 => array('code' => 'LDAP_SIZELIMIT_EXCEEDED',        'desc' => 'Sizelimit exceeded'),
             5 => array('code' => 'LDAP_COMPARE_FALSE',             'desc' => 'Compare false'),
             6 => array('code' => 'LDAP_COMPARE_TRUE',              'desc' => 'Compare true'),
             7 => array('code' => 'LDAP_STRONG_AUTH_NOT_SUPPORTED', 'desc' => 'Strong authentication not supported'),
             8 => array('code' => 'LDAP_STRONG_AUTH_REQUIRED',      'desc' => 'Strong authentication required'),
             9 => array('code' => 'LDAP_PARTIAL_RESULTS',           'desc' => 'Partial results'),
            10 => array('code' => '',                               'desc' => 'Referral'),
            11 => array('code' => '',                               'desc' => 'Administrative limit exceeded'),
            12 => array('code' => '',                               'desc' => 'Critical extension is unavailable'),
            13 => array('code' => '',                               'desc' => 'Confidentiality required'),
            14 => array('code' => '',                               'desc' => 'SASL bind in progress'),
            15 => array('code' => '',                               'desc' => 'Unknown error'),
            16 => array('code' => 'LDAP_NO_SUCH_ATTRIBUTE',         'desc' => 'No such attribute'),
            17 => array('code' => 'LDAP_UNDEFINED_TYPE',            'desc' => 'Undefined attribute type'),
            18 => array('code' => 'LDAP_INAPPROPRIATE_MATCHING',    'desc' => 'Inappropriate matching'),
            19 => array('code' => 'LDAP_CONSTRAINT_VIOLATION',      'desc' => 'Constraint violation'),
            20 => array('code' => 'LDAP_TYPE_OR_VALUE_EXISTS',      'desc' => 'Type or value exists'),
            21 => array('code' => 'LDAP_INVALID_SYNTAX',            'desc' => 'Invalid syntax'),
            32 => array('code' => 'LDAP_NO_SUCH_OBJECT',            'desc' => 'No such object'),
            33 => array('code' => 'LDAP_ALIAS_PROBLEM',             'desc' => 'Alias problem'),
            34 => array('code' => 'LDAP_INVALID_DN_SYNTAX',         'desc' => 'Invalid DN syntax'),
            35 => array('code' => 'LDAP_IS_LEAF',                   'desc' => 'Object is a leaf'),
            36 => array('code' => 'LDAP_ALIAS_DEREF_PROBLEM',       'desc' => 'Alias dereferencing problem'),
            47 => array('code' => '',                               'desc' => 'Proxy Authorization Failure'),
            48 => array('code' => 'LDAP_INAPPROPRIATE_AUTH',        'desc' => 'Inappropriate authentication'),
            49 => array('code' => 'LDAP_INVALID_CREDENTIALS',       'desc' => 'Invalid credentials'),
            50 => array('code' => 'LDAP_INSUFFICIENT_ACCESS',       'desc' => 'Insufficient access'),
            51 => array('code' => 'LDAP_BUSY',                      'desc' => 'DSA is busy'),
            52 => array('code' => 'LDAP_UNAVAILABLE',               'desc' => 'DSA is unavailable'),
            53 => array('code' => 'LDAP_UNWILLING_TO_PERFORM',      'desc' => 'DSA is unwilling to perform'),
            54 => array('code' => 'LDAP_LOOP_DETECT',               'desc' => 'Loop detected'),
            64 => array('code' => 'LDAP_NAMING_VIOLATION',          'desc' => 'Naming violation'),
            65 => array('code' => 'LDAP_OBJECT_CLASS_VIOLATION',    'desc' => 'Object class violation'),
            66 => array('code' => 'LDAP_NOT_ALLOWED_ON_NONLEAF',    'desc' => 'Operation not allowed on nonleaf'),
            67 => array('code' => 'LDAP_NOT_ALLOWED_ON_RDN',        'desc' => 'Operation not allowed on RDN'),
            68 => array('code' => 'LDAP_ALREADY_EXISTS',            'desc' => 'Already exists'),
            69 => array('code' => 'LDAP_NO_OBJECT_CLASS_MODS',      'desc' => 'Cannot modify object class'),
            70 => array('code' => 'LDAP_RESULTS_TOO_LARGE',         'desc' => 'Results too large'),
            80 => array('code' => 'LDAP_OTHER',                     'desc' => 'Unknown error'),
            81 => array('code' => 'LDAP_SERVER_DOWN',               'desc' => 'Can\'t contact LDAP server'),
            82 => array('code' => 'LDAP_LOCAL_ERROR',               'desc' => 'Local error'),
            83 => array('code' => 'LDAP_ENCODING_ERROR',            'desc' => 'Encoding error'),
            84 => array('code' => 'LDAP_DECODING_ERROR',            'desc' => 'Decoding error'),
            85 => array('code' => 'LDAP_TIMEOUT',                   'desc' => 'Timed out'),
            86 => array('code' => 'LDAP_AUTH_UNKNOWN',              'desc' => 'Unknown authentication method'),
            87 => array('code' => 'LDAP_FILTER_ERROR',              'desc' => 'Bad search filter'),
            88 => array('code' => 'LDAP_USER_CANCELLED',            'desc' => 'User cancelled operation'),
            89 => array('code' => 'LDAP_PARAM_ERROR',               'desc' => 'Bad parameter to an ldap routine'),
            90 => array('code' => 'LDAP_NO_MEMORY',                 'desc' => 'Out of memory'),
    ); // end array codes
    if (array_key_exists($err,$codes)) {
      return (array) $codes[$err];
    } else {
      return (array) array('code' =>  '', 'desc' => $this->perr2str($err));
    }
  }
}
?>
