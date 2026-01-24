when i use the modes (i.e., :register) it still types the text into the text field
we need to capture it so it doesn't enter the input field (completely disable regular editing)
and only captures the commands

right now, fetching the bank info (/api/bank) is failing for some reason (no errors in backend, must be frontend)
we should track errors in a client log (should put it in ~/.bank-game dir)

when you first load the tui, we should clear the terminal (so that the tui becomes the first text at the top)

would be nice to have a server status (based on health check) symbol somewhere

for development, we should have some basic default fixtures (should pre-populate a simple user)
user: dead@beef.com
pass: deadbeef
company: Beef Bank
