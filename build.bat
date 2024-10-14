:: THIS IS THE BUILD PROCESS RIGHT BEFORE PUSHING. IF YOU ARE IN DEVELOPMENT, THERE IS NO NEED TO RUN THIS BATCH FILE.
:: IT WILL RUN THE TEST SUITE, BUILD THE PROJECT, AND THEN MINIFY AND COMPILE SOURCE MAPS. THIS COULD EASILY TAKE A MINUTE.

echo Building project

cmd /c npm run build
@REM cmd /c node minify.js

echo Running test suite. Be sure to check that all tests pass.
cmd /c npm run test