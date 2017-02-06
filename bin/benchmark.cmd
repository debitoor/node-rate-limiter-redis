@echo off

cd %~dp0

if exist *.benchmark-lock del *.benchmark-lock
if exist .output del .output

node ../benchmark/index %1 --validate-method >> .output
if NOT %errorlevel% == 0 (
    echo.
    echo usage:
    echo        benchmark.cmd method
    echo.
    type .output
    echo.
    del .output
    exit errorlevel
)
del .output

echo low load (1k requests in 2s)
start /b cmd /c "node ../benchmark/index %1 2000 200 && echo 'done' >> 1.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 200 && echo 'done' >> 2.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 200 && echo 'done' >> 3.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 200 && echo 'done' >> 4.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 200 && echo 'done' >> 5.benchmark-lock"
:loop1
set cnt=0
for %%A in (*.benchmark-lock) do set /a cnt+=1
if %cnt% == 5 goto :next1
goto loop1
:next1
del *.benchmark-lock


echo normal load (10k requests in 2s)
start /b cmd /c "node ../benchmark/index %1 2000 2000 && echo 'done' >> 1.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 2000 && echo 'done' >> 2.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 2000 && echo 'done' >> 3.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 2000 && echo 'done' >> 4.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 2000 && echo 'done' >> 5.benchmark-lock"
:loop2
set cnt=0
for %%A in (*.benchmark-lock) do set /a cnt+=1
if %cnt% == 5 goto :next2
goto loop2
:next2
del *.benchmark-lock


echo high load (20k requests in 2s)
start /b cmd /c "node ../benchmark/index %1 2000 4000 && echo 'done' >> 1.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 4000 && echo 'done' >> 2.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 4000 && echo 'done' >> 3.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 4000 && echo 'done' >> 4.benchmark-lock"
start /b cmd /c "node ../benchmark/index %1 2000 4000 && echo 'done' >> 5.benchmark-lock"
:loop3
set cnt=0
for %%A in (*.benchmark-lock) do set /a cnt+=1
if %cnt% == 5 goto :next3
goto loop3
:next3
del *.benchmark-lock

@echo on