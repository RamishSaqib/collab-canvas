```mermaid
graph TB
    subgraph ClientBrowser1["Client Browser 1"]
        U1[User 1]
        
        subgraph ReactApp1["React Application"]
            A1[App.tsx]
            
            subgraph AuthLayer["Auth Layer"]
                AW1[AuthWrapper]
                LF1[LoginForm]
                SF1[SignupForm]
            end
            
            subgraph CanvasLayer["Canvas Layer"]
                C1[Canvas Component]
                TB1[Toolbar]
                S1[Shape Components]
                CR1[Cursor Components]
            end
            
            subgraph PresenceLayer["Presence Layer"]
                PL1[PresenceList]
            end
            
            subgraph StateManagement["State Management"]
                UC1[useCanvas Hook]
                UF1[useFirestore Hook]
                UCR1[useCursors Hook]
                UP1[usePresence Hook]
            end
            
            subgraph Utilities["Utilities"]
                CU1[Canvas Utils]
                T1[Types]
            end
        end
        
        subgraph KonvaRendering["Konva Rendering"]
            K1[Konva.js]
            Stage1[Stage]
            Layer1[Layer]
        end
    end
    
    subgraph ClientBrowser2["Client Browser 2"]
        U2[User 2]
        
        subgraph ReactApp2["React Application 2"]
            A2[App.tsx]
            C2[Canvas Component]
            S2[Shape Components]
            CR2[Cursor Components]
            UC2[useCanvas Hook]
            UF2[useFirestore Hook]
            UCR2[useCursors Hook]
        end
        
        K2[Konva.js]
    end
    
    subgraph FirebaseBackend["Firebase Backend"]
        subgraph FirebaseAuth["Firebase Auth"]
            AUTH[Authentication Service]
            EA[Email Password Provider]
            GA[Google OAuth Provider]
        end
        
        subgraph CloudFirestore["Cloud Firestore"]
            FS[Firestore Database]
            
            subgraph DataStructure["Data Structure"]
                CV[canvases Collection]
                OBJ[objects Subcollection]
            end
        end
        
        subgraph RealtimeDB["Realtime Database"]
            RTDB[Realtime Database]
            
            subgraph RealtimeData["Realtime Data"]
                CURS[cursors data]
                PRES[presence data]
            end
        end
        
        subgraph FirebaseHosting["Firebase Hosting"]
            HOST[Static Hosting]
            CDN[Global CDN]
        end
    end
    
    subgraph TestingInfra["Testing Infrastructure"]
        subgraph UnitTests["Unit Tests"]
            UT1[canvas.test.ts]
            UT2[useCanvas.test.ts]
        end
        
        subgraph IntegrationTests["Integration Tests"]
            IT1[shape-creation.test.tsx]
            IT2[shape-persistence.test.tsx]
            IT3[shape-sync.test.tsx]
            IT4[multiplayer-cursors.test.tsx]
        end
        
        VITEST[Vitest Test Runner]
    end
    
    U1 -->|Interacts| A1
    U2 -->|Interacts| A2
    
    A1 --> AW1
    AW1 --> LF1
    AW1 --> SF1
    A1 --> C1
    A1 --> PL1
    C1 --> TB1
    C1 --> S1
    C1 --> CR1
    
    C1 --> UC1
    UC1 --> UF1
    C1 --> UCR1
    C1 --> UP1
    UC1 --> CU1
    UC1 --> T1
    
    C1 --> K1
    K1 --> Stage1
    Stage1 --> Layer1
    Layer1 --> S1
    
    LF1 -->|signInWithEmail| AUTH
    SF1 -->|signUpWithEmail| AUTH
    LF1 -->|signInWithGoogle| AUTH
    AUTH --> EA
    AUTH --> GA
    AUTH -->|User Token| AW1
    
    UF1 -->|Create Update Shape| FS
    UF1 -->|Subscribe onSnapshot| FS
    FS -->|Real-time Updates| UF1
    FS --> CV
    CV --> OBJ
    OBJ -->|Shape Data| UC1
    
    UF2 -->|Create Update Shape| FS
    UF2 -->|Subscribe onSnapshot| FS
    FS -->|Real-time Updates| UF2
    OBJ -->|Shape Data| UC2
    
    UCR1 -->|Broadcast Position 30Hz| RTDB
    UCR1 -->|Subscribe to Others| RTDB
    RTDB --> CURS
    CURS -->|Cursor Positions| UCR1
    
    UCR2 -->|Broadcast Position 30Hz| RTDB
    UCR2 -->|Subscribe to Others| RTDB
    CURS -->|Cursor Positions| UCR2
    
    UP1 -->|Join Update Presence| RTDB
    UP1 -->|onDisconnect Handler| RTDB
    UP1 -->|Subscribe to Users| RTDB
    RTDB --> PRES
    PRES -->|Online Users| PL1
    
    HOST -->|Serves Build| CDN
    CDN -->|Delivers| U1
    CDN -->|Delivers| U2
    
    UT1 -.Tests.-> CU1
    UT2 -.Tests.-> UC1
    IT1 -.Tests.-> C1
    IT2 -.Tests.-> UF1
    IT3 -.Tests.-> UF1
    IT4 -.Tests.-> UCR1
    VITEST -.Runs.-> UT1
    VITEST -.Runs.-> UT2
    VITEST -.Runs.-> IT1
    VITEST -.Runs.-> IT2
    VITEST -.Runs.-> IT3
    VITEST -.Runs.-> IT4
    
    UC1 -.Real-time Sync.-> UC2
    UCR1 -.Real-time Cursors.-> UCR2
    
    classDef firebase fill:#FFA611,stroke:#FF8800,stroke-width:2px,color:#000
    classDef react fill:#61DAFB,stroke:#0088CC,stroke-width:2px,color:#000
    classDef konva fill:#00D4FF,stroke:#0099CC,stroke-width:2px,color:#000
    classDef test fill:#729B1B,stroke:#5A7A15,stroke-width:2px,color:#fff
    
    class AUTH,EA,GA,FS,CV,OBJ,RTDB,CURS,PRES,HOST,CDN firebase
    class A1,A2,AW1,LF1,SF1,C1,C2,TB1,S1,S2,CR1,CR2,PL1,UC1,UC2,UF1,UF2,UCR1,UCR2,UP1,CU1,T1 react
    class K1,K2,Stage1,Layer1 konva
    class UT1,UT2,IT1,IT2,IT3,IT4,VITEST test