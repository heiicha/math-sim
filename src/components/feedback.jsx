import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import "./feedback.css"

function FeedbackButton() {
    return (
        <div> 
            <Link to='https://docs.google.com/forms/d/e/1FAIpQLSdhZHgLVDqmxbv2ajIzxnea7_JZeL53OvICwaKFD7dUWK0iEA/viewform?usp=sharing&ouid=111965143662204677500'>
            <button className="feedback-button"> Have any feedback? </button>
            </Link>
        </div>
    );
}
export default FeedbackButton