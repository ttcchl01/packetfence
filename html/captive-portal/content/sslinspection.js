/* -*- Mode: javascript; indent-tabs-mode: nil; c-basic-offset: 2 -*- */
$('#test').on('click', function() {
  $.ajax({ 
    url: 'https://packetfence.org/ssl-test/', 
    method: 'GET' 
  })
 .done(function() {
    window.location.href = "/captive-portal?next=next";
 })
 .fail(function() {
    testFailed();
 });
 return false;
});


$(function() {
  'use strict';

  window.testFailed = function() {
    $('#testFailure').removeClass('hide');
  };
});

