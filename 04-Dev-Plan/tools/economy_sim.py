"""Mô phỏng rơi Chip Lõi và chi phí nâng cấp (Monte Carlo). Chạy: python economy_sim.py
Chỉnh P (tỷ lệ), pity, chips_per_run, hệ số chi phí để chạy lại khi cân bằng.
"""
import random, statistics as st
random.seed(7)
P={'common':.60,'rare':.28,'epic':.10,'legendary':.019,'mythic':.001}
def roll(state):
    state['l']+=1; state['m']+=1
    if state['m']>=600: state['l']=0; state['m']=0; return 'mythic'
    if state['l']>=80: state['l']=0; return 'legendary'
    r=random.random(); c=0
    for k,v in P.items():
        c+=v
        if r<c:
            if k=='legendary': state['l']=0
            if k=='mythic': state['l']=0; state['m']=0
            return k
    return 'common'
def full_set(chips_per_run=2, need=6):
    s={'l':0,'m':0}; have=set(); runs=0; chips=0
    while len(have)<need:
        runs+=1
        for _ in range(chips_per_run):
            chips+=1
            k=roll(s)
            if k in('legendary','mythic'): have.add(random.randrange(6))
    return runs,chips
def first_leg(cpr=3):
    s={'l':0,'m':0}; runs=0
    while True:
        runs+=1
        for _ in range(cpr):
            if roll(s) in('legendary','mythic'): return runs
def four_of_six(cpr=2):
    s={'l':0,'m':0}; have=set(); runs=0
    while len(have)<4:
        runs+=1
        for _ in range(cpr):
            if roll(s) in('legendary','mythic'): have.add(random.randrange(6))
    return runs
def mythic_first(cpr=3):
    s={'l':0,'m':0}; runs=0
    while True:
        runs+=1
        for _ in range(cpr):
            if roll(s)=='mythic': return runs
N=4000
def stats(f,*a):
    xs=sorted(f(*a) if not isinstance(f(*a),tuple) else f(*a)[0] for _ in range(N))
    return round(st.mean(xs),1), xs[int(N*.5)], xs[int(N*.9)]
print('first legendary (runs, 3 chips/run):',stats(first_leg))
print('4-of-6 legendary slots set (runs, 2 chips/run):',stats(four_of_six))
fs=[full_set()[0] for _ in range(N)]; fs.sort(); print('6-of-6 legendary set runs mean/p50/p90:',round(st.mean(fs),1),fs[N//2],fs[int(N*.9)])
mf=[mythic_first() for _ in range(N)]; mf.sort(); print('first mythic runs mean/p50/p90:',round(st.mean(mf),1),mf[N//2],mf[int(N*.9)])
# upgrade cost
cb=[round(200*1.2**(n-1)) for n in range(1,16)]; cry=[(n+1)//2 for n in range(1,16)]
print('core bit per chip to +15:',sum(cb),'x6 =',6*sum(cb),'crystals per chip',sum(cry),'x6',6*sum(cry))
print('mastery shards per weapon (6n):',sum(6*n for n in range(1,11)))
# gem
spin_ev_gem=.12*10+.06*30; print('spin EV gem/spin',spin_ev_gem)
packs=[(0.99,80),(2.99,260),(4.99,450),(9.99,950),(19.99,2000),(49.99,5200),(99.99,10800)]
print('usd per gem',[round(p/g,4) for p,g in packs])
