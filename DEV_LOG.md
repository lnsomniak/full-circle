# Developmental Log

## Issue: Github Authentication Failure
**Date:** Nov 22, 2025
**Time:** 6:16PM
**Problem:** Couldn't git push using password
**Solution:** Reddit lists setting up SSH keys for secure authentication through Ubuntu Terminal.

## Issue: Operation Not supported!
**Date:** Nov 22, 2025
**Time:** 8:03PM 
**Problem:** Ran a test simply testing the authentication features, yet VM couldn't open without a GUI
**Solution:** Grab the link it provided, paste onto my home machine, and then it'll redirect me completing the test. 
**What I learned:** 
- Spotipy automatically runs a local server on port 8888 to catch the callback
- Spotify hates when I use localhost so for a redirect link always use the numerical version (127.0.0.1)
- VM and Host Machine can communicate through network ports even without a GUI  

## Issue: Raw json data was unformatted
**Date:** Nov 23, 2025
**Time:** 11:29PM
**Problem:** Took the data from spotify, ideally getting my recently played songs through the "user-read-recently-played" scope on spotify's documentation. This was succcessful, however it was formatted incorrectly!
**Solution:** Imported JSON and used "json.dumps()" to convert the dictionary to a formatted string, using "indent=2" to properly indent the formatted string.
**What I'll be doing next:** What it does is nice, however it gives me all the information. That's not what I need for this. Going to replace the print function with a for loop likely that loops through each item, and then extracts the data that I want and prints it into a clean format. 

## Close Call: Basic loop avoided
**Date:** Nov 23, 2025
**Time:** 11:46PM
**Problem:** Brainstorming on how to implement the formatting for this JSON data, I nearly wrote and implemented a basic loop that would've left out plenty edge cases- mainly errroring out if the song had more than one artist! Not ideal for development nor LLM training. 
**Solution:** Using modules like datetime to fix the ugly time formatting and incorporating a way to get all the artists first and THEN join them together. 

## Goal Reached
**Date:** Nov 24, 2025
**Time:** 12:08AM
**Accomplishments:** 
- Successfully pulled listening history from Spotify's API
- Implemented an improved loop before committing it, saving myself the headache (See '## Close Call') 
- Handled multiple artists issue with list comprehension and .join()
- Converted ugly ISO timestamps that Spotify gives out and converted it to a readable human format using a python module in datetime
- Finally got proof of concept after a day of working and reading documentation! 
 
