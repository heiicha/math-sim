import React, { Component } from 'react';
import {Link} from 'react-router-dom'
import "./feedback.css"

function FeedbackButton() {
    return (
        <div> 
            <Link to='https://www.youtube.com/watch?v=mpa781T8F5U'>
            <button className="feedback-button"> Have any feedback? </button>
            </Link>
        </div>
    );
}
export default FeedbackButton