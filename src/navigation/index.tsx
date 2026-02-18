import React, { useState } from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { View, TouchableOpacity } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../theme/ThemeContext';
import { Colors, Shadows } from '../theme/theme';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Auth Screens
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';

// Dashboard Screens
import { PersonelDashboard } from '../screens/dashboard/PersonelDashboard';
import { IdariDashboard } from '../screens/dashboard/IdariDashboard';
import { MuhasebeDashboard } from '../screens/dashboard/MuhasebeDashboard';

// Leave Screens
import { LeaveRequestScreen } from '../screens/leave/LeaveRequestScreen';
import { LeaveListScreen } from '../screens/leave/LeaveListScreen';
import { LeaveDetailScreen } from '../screens/leave/LeaveDetailScreen';

// Expense Screens
import { ExpenseUploadScreen } from '../screens/expense/ExpenseUploadScreen';
import { ExpenseListScreen } from '../screens/expense/ExpenseListScreen';
import { ExpenseDetailScreen } from '../screens/expense/ExpenseDetailScreen';

// Attendance Screens
import { AttendanceScanScreen } from '../screens/attendance/AttendanceScanScreen';
import { AttendanceQRScreen } from '../screens/attendance/AttendanceQRScreen';
import { AttendanceReportScreen } from '../screens/attendance/AttendanceReportScreen';

// Profile & Settings
import { ProfileScreen } from '../screens/profile/ProfileScreen';
import { SettingsScreen } from '../screens/settings/SettingsScreen';
import { CompanyManagementScreen } from '../screens/settings/CompanyManagementScreen';

// Announcements
import { AnnouncementListScreen } from '../screens/announcement/AnnouncementListScreen';
import { CreateAnnouncementScreen } from '../screens/announcement/CreateAnnouncementScreen';

// Invoices / Documents
import { InvoiceUploadScreen } from '../screens/invoice/InvoiceUploadScreen';
import { InvoiceListScreen } from '../screens/invoice/InvoiceListScreen';
import { InvoiceDetailScreen } from '../screens/invoice/InvoiceDetailScreen';

// Menu
import { MenuScreen } from '../screens/menu/MenuScreen';

// Reports
import { ReportsScreen } from '../screens/reports/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ─── Auth Navigator ─────────────────────────────────────
function AuthNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Login">
        {({ navigation }) => (
          <LoginScreen
            onNavigateRegister={() => navigation.navigate('Register')}
            onNavigateForgotPassword={() => navigation.navigate('ForgotPassword')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {({ navigation }) => (
          <RegisterScreen onNavigateLogin={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="ForgotPassword">
        {({ navigation }) => (
          <ForgotPasswordScreen onNavigateLogin={() => navigation.goBack()} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// ─── Dashboard Tab Screen (role-based) ─────────────────
function DashboardScreen({ navigation }: any) {
  const { profile } = useAuth();
  const role = profile?.role;

  const navigateLeaveList = () => navigation.navigate('LeaveList');
  const navigateExpenseList = () => navigation.navigate('ExpenseList');
  const navigateNewLeave = () => navigation.navigate('LeaveRequest');
  const navigateNewExpense = () => navigation.navigate('ExpenseUpload');
  const navigateLeaveDetail = (id: string) => navigation.navigate('LeaveDetail', { leaveId: id });
  const navigateExpenseDetail = (id: string) => navigation.navigate('ExpenseDetail', { expenseId: id });
  const navigateAttendanceQR = () => navigation.navigate('AttendanceQR');
  const navigateAttendanceReport = () => navigation.navigate('AttendanceReport');
  const navigateAttendanceScan = () => navigation.navigate('AttendanceScan');
  const navigateAnnouncements = () => navigation.navigate('AnnouncementList');

  if (role === 'idari' || role === 'admin') {
    return (
      <IdariDashboard
        onNavigateLeaveList={navigateLeaveList}
        onNavigateExpenseList={navigateExpenseList}
        onNavigateNewLeave={navigateNewLeave}
        onNavigateLeaveDetail={navigateLeaveDetail}
        onNavigateAttendanceQR={navigateAttendanceQR}
        onNavigateAttendanceReport={navigateAttendanceReport}
        onNavigateAnnouncements={navigateAnnouncements}
      />
    );
  }

  if (role === 'muhasebe') {
    return (
      <MuhasebeDashboard
        onNavigateExpenseList={navigateExpenseList}
        onNavigateExpenseDetail={navigateExpenseDetail}
        onNavigateNewLeave={navigateNewLeave}
        onNavigateAnnouncements={navigateAnnouncements}
      />
    );
  }

  return (
    <PersonelDashboard
      onNavigateLeaveList={navigateLeaveList}
      onNavigateExpenseList={navigateExpenseList}
      onNavigateNewLeave={navigateNewLeave}
      onNavigateNewExpense={navigateNewExpense}
      onNavigateAttendance={navigateAttendanceScan}
      onNavigateAnnouncements={navigateAnnouncements}
    />
  );
}

// ─── Leave Tab Screen ──────────────────────────────────
function LeaveTabScreen({ navigation }: any) {
  return (
    <LeaveListScreen
      onNavigateDetail={(id) => navigation.navigate('LeaveDetail', { leaveId: id })}
      onNavigateCreate={() => navigation.navigate('LeaveRequest')}
      onBack={() => navigation.goBack()}
    />
  );
}

// ─── Expense Tab Screen ────────────────────────────────
function ExpenseTabScreen({ navigation }: any) {
  return (
    <ExpenseListScreen
      onNavigateDetail={(id) => navigation.navigate('ExpenseDetail', { expenseId: id })}
      onNavigateCreate={() => navigation.navigate('ExpenseUpload')}
      onBack={() => navigation.goBack()}
    />
  );
}



// ─── Settings Tab Screen ───────────────────────────────
function SettingsTabScreen({ navigation }: any) {
  return (
    <SettingsScreen
      onBack={() => navigation.goBack()}
      onNavigateProfile={() => navigation.navigate('Profile')}
      onNavigateCompanyManagement={() => navigation.navigate('CompanyManagement')}
    />
  );
}

// ─── Menu Tab Screen ──────────────────────────────────
function MenuTabScreen({ navigation }: any) {
  const { profile } = useAuth();

  const handleAttendance = () => {
    const isAdmin = profile?.role === 'idari' || profile?.role === 'admin';
    if (isAdmin) {
      navigation.navigate('AttendanceQR');
    } else {
      navigation.navigate('AttendanceScan');
    }
  };

  return (
    <MenuScreen
      onNavigateInvoiceList={() => navigation.navigate('InvoiceList')}
      onNavigateAttendance={handleAttendance}
      onNavigateProfile={() => navigation.navigate('Profile')}
      onNavigateSettings={() => navigation.navigate('Settings')}
      onNavigateReports={() => navigation.navigate('Reports')}
    />
  );
}

// ─── Custom FAB Button ─────────────────────────────────
function CustomTabBarButton({ children, onPress }: any) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={{
        top: -30,
        justifyContent: 'center',
        alignItems: 'center',
        ...Shadows.medium,
      }}
      onPress={onPress}
      activeOpacity={0.9}
    >
      <View
        style={{
          width: 70,
          height: 70,
          borderRadius: 35,
          backgroundColor: Colors.primary,
          justifyContent: 'center',
          alignItems: 'center',
          borderWidth: 4,
          borderColor: colors.background,
        }}
      >
        {children}
      </View>
    </TouchableOpacity>
  );
}



// ─── Bottom Tab Navigator ──────────────────────────────
function MainTabs() {
  const { colors, isDark } = useTheme();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.tabBarBorder,
          borderTopWidth: 1,
          height: 60 + (insets.bottom > 0 ? insets.bottom : 20),
          paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
          paddingTop: 10,
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          tabBarLabel: 'Ana Sayfa',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="LeaveTab"
        component={LeaveTabScreen}
        options={{
          tabBarLabel: 'İzinler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar" size={size} color={color} />
          ),
        }}
      />

      {/* Center FAB */}
      <Tab.Screen
        name="AttendanceFAB"
        component={View} // Dummy component
        listeners={({ navigation }) => ({
          tabPress: (e) => {
            e.preventDefault();
            // Role check: idari/admin -> Create QR, others -> Scan QR
            const isAdmin = profile?.role === 'idari' || profile?.role === 'admin';
            if (isAdmin) {
              navigation.navigate('AttendanceQR');
            } else {
              navigation.navigate('AttendanceScan');
            }
          },
        })}
        options={{
          tabBarIcon: ({ color }) => {
            const isAdmin = profile?.role === 'idari' || profile?.role === 'admin';
            return <Ionicons name={isAdmin ? "qr-code-outline" : "scan-outline"} size={32} color="#FFF" />;
          },
          tabBarButton: (props) => <CustomTabBarButton {...props} />,
          tabBarLabel: () => null, // No label
        }}
      />

      <Tab.Screen
        name="ExpenseTab"
        component={ExpenseTabScreen}
        options={{
          tabBarLabel: 'Fişler',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="receipt" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="MenuTab"
        component={MenuTabScreen}
        options={{
          tabBarLabel: 'Menü',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Main Stack Navigator ──────────────────────────────
function MainNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={MainTabs} />
      <Stack.Screen name="LeaveRequest">
        {({ navigation }) => (
          <LeaveRequestScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="LeaveList">
        {({ navigation }) => (
          <LeaveListScreen
            onNavigateDetail={(id) => navigation.navigate('LeaveDetail', { leaveId: id })}
            onNavigateCreate={() => navigation.navigate('LeaveRequest')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="LeaveDetail">
        {({ navigation, route }) => (
          <LeaveDetailScreen
            leaveId={(route.params as any)?.leaveId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ExpenseUpload">
        {({ navigation }) => (
          <ExpenseUploadScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="ExpenseList">
        {({ navigation }) => (
          <ExpenseListScreen
            onNavigateDetail={(id) => navigation.navigate('ExpenseDetail', { expenseId: id })}
            onNavigateCreate={() => navigation.navigate('ExpenseUpload')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="ExpenseDetail">
        {({ navigation, route }) => (
          <ExpenseDetailScreen
            expenseId={(route.params as any)?.expenseId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Profile">
        {({ navigation }) => (
          <ProfileScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="CompanyManagement">
        {({ navigation }) => (
          <CompanyManagementScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Settings">
        {({ navigation }) => (
          <SettingsScreen
            onBack={() => navigation.goBack()}
            onNavigateProfile={() => navigation.navigate('Profile')}
            onNavigateCompanyManagement={() => navigation.navigate('CompanyManagement')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Reports">
        {({ navigation }) => (
          <ReportsScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="AttendanceReport">
        {({ navigation }) => (
          <AttendanceReportScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="AttendanceQR">
        {({ navigation }) => (
          <AttendanceQRScreen
            onBack={() => navigation.goBack()}
            onNavigateReport={() => navigation.navigate('AttendanceReport')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AttendanceScan">
        {({ navigation }) => (
          <AttendanceScanScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="AnnouncementList">
        {({ navigation }) => (
          <AnnouncementListScreen
            onBack={() => navigation.goBack()}
            onNavigateCreate={() => navigation.navigate('CreateAnnouncement')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="CreateAnnouncement">
        {({ navigation }) => (
          <CreateAnnouncementScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="InvoiceUpload">
        {({ navigation }) => (
          <InvoiceUploadScreen onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="InvoiceList">
        {({ navigation }) => (
          <InvoiceListScreen
            onNavigateDetail={(id) => navigation.navigate('InvoiceDetail', { invoiceId: id })}
            onNavigateCreate={() => navigation.navigate('InvoiceUpload')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="InvoiceDetail">
        {({ navigation, route }) => (
          <InvoiceDetailScreen
            invoiceId={(route.params as any)?.invoiceId}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}

// ─── Root Navigator ────────────────────────────────────
export function Navigation() {
  const { user, loading } = useAuth();
  const { colors, isDark } = useTheme();

  if (loading) {
    return <LoadingSpinner message="Yükleniyor..." />;
  }

  const navTheme = isDark
    ? {
      ...DarkTheme,
      colors: {
        ...DarkTheme.colors,
        background: colors.background,
        card: colors.card,
        border: colors.border,
        text: colors.text,
        primary: Colors.primary,
      },
    }
    : {
      ...DefaultTheme,
      colors: {
        ...DefaultTheme.colors,
        background: colors.background,
        card: colors.card,
        border: colors.border,
        text: colors.text,
        primary: Colors.primary,
      },
    };

  return (
    <NavigationContainer theme={navTheme}>
      {user ? <MainNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}
