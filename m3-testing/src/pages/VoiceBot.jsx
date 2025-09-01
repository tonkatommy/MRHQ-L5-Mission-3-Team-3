import React, { useState, useEffect } from 'react';

import '../App.css'
import MyTextInput from '../components/TextInput';

function VoiceBot() {
    const [jobType, setJobType] = useState('');
    const [jobOnUse, setJobOnUse] = useState(false);

    useEffect(() => {
        if (!jobOnUse) return;
        async function main() {
            // pass
        }
        main();
    }, [jobOnUse, jobType]);

    return (
        <div>
            <h1>Voice Bot</h1>
            <p>{jobType}</p>
            <MyTextInput setTextValue={setJobType} setOnUse={setJobOnUse}/>
        </div>
    );
}

export default VoiceBot;